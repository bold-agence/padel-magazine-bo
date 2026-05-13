import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import {
  FipRanking,
  FipRankingGender,
  FipRankingsPayload,
  FipRankingsService,
  ReplaceFipRankingPayload,
} from '../../../../core/services/fip-rankings.service';

type EntryForm = {
  rank: number;
  playerName: string;
  countryCode: string;
  points: number | null;
  playerImageUrl: string;
  playerImageFile: File | null;
  imagePreviewUrl: string;
};

type RankingForm = {
  title: string;
  rankingDate: string;
  sourceUrl: string;
  isPublished: boolean;
  entries: EntryForm[];
};

const COUNTRY_ALPHA3_TO_ALPHA2: Record<string, string> = {
  AND: 'AD',
  ARG: 'AR',
  AUS: 'AU',
  AUT: 'AT',
  BEL: 'BE',
  BRA: 'BR',
  CAN: 'CA',
  CHE: 'CH',
  CHL: 'CL',
  COL: 'CO',
  DEU: 'DE',
  DNK: 'DK',
  ESP: 'ES',
  FIN: 'FI',
  FRA: 'FR',
  GBR: 'GB',
  IRL: 'IE',
  ITA: 'IT',
  MEX: 'MX',
  NED: 'NL',
  NLD: 'NL',
  NOR: 'NO',
  POL: 'PL',
  PRT: 'PT',
  POR: 'PT',
  QAT: 'QA',
  SWE: 'SE',
  UAE: 'AE',
  USA: 'US',
  URY: 'UY',
};

@Component({
  selector: 'app-fip-rankings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './fip-rankings-page.component.html',
})
export class FipRankingsPageComponent implements OnInit {
  activeGender: FipRankingGender = 'men';
  forms: Record<FipRankingGender, RankingForm> = {
    men: this.createDefaultForm('men'),
    women: this.createDefaultForm('women'),
  };

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly fipRankingsService: FipRankingsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.fipRankingsService.findAdmin().subscribe({
      next: (payload) => {
        this.forms = {
          men: this.toForm('men', payload),
          women: this.toForm('women', payload),
        };
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les classements Premier Padel.';
        this.isLoading = false;
      },
    });
  }

  selectGender(gender: FipRankingGender): void {
    this.activeGender = gender;
    this.errorMessage = '';
    this.successMessage = '';
  }

  save(): void {
    if (this.isSaving) return;
    const form = this.activeForm;
    const payload = this.buildPayload(form);
    if (!payload) return;

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadPendingImages(form, payload)
      .pipe(
        switchMap((resolvedPayload) =>
          this.fipRankingsService.replace(this.activeGender, resolvedPayload),
        ),
      )
      .subscribe({
        next: (ranking) => {
          this.forms[this.activeGender] = this.toFormFromRanking(
            this.activeGender,
            ranking,
          );
          this.successMessage = 'Classement enregistré.';
          this.isSaving = false;
        },
        error: (e: unknown) => {
          this.errorMessage = this.parseApiError(e);
          this.isSaving = false;
        },
      });
  }

  get activeForm(): RankingForm {
    return this.forms[this.activeGender];
  }

  protected formatGender(gender: FipRankingGender): string {
    return gender === 'men' ? 'Hommes' : 'Femmes';
  }

  protected onPlayerImageSelected(entry: EntryForm, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Le fichier choisi doit être une image.';
      return;
    }
    entry.playerImageFile = file;
    entry.imagePreviewUrl = URL.createObjectURL(file);
  }

  protected removePlayerImage(entry: EntryForm): void {
    entry.playerImageFile = null;
    entry.playerImageUrl = '';
    entry.imagePreviewUrl = '';
  }

  protected countryFlag(countryCode: string): string {
    const code = countryCode.trim().toUpperCase();
    const alpha2 = code.length === 2 ? code : COUNTRY_ALPHA3_TO_ALPHA2[code];
    if (!alpha2 || !/^[A-Z]{2}$/.test(alpha2)) {
      return '';
    }
    return Array.from(alpha2)
      .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join('');
  }

  private createDefaultForm(gender: FipRankingGender): RankingForm {
    return {
      title:
        gender === 'men'
          ? 'Top 10 Mondial Premier Padel - Hommes'
          : 'Top 10 Mondial Premier Padel - Femmes',
      rankingDate: '',
      sourceUrl: 'https://www.padelfip.com/fip-rankings/',
      isPublished: false,
      entries: Array.from({ length: 10 }, (_, index) => ({
        rank: index + 1,
        playerName: '',
        countryCode: '',
        points: null,
        playerImageUrl: '',
        playerImageFile: null,
        imagePreviewUrl: '',
      })),
    };
  }

  private toForm(
    gender: FipRankingGender,
    payload: FipRankingsPayload,
  ): RankingForm {
    const ranking = payload[gender];
    if (!ranking) {
      return this.createDefaultForm(gender);
    }
    return this.toFormFromRanking(gender, ranking);
  }

  private toFormFromRanking(
    gender: FipRankingGender,
    ranking: FipRanking,
  ): RankingForm {
    const base = this.createDefaultForm(gender);
    const entries = [...(ranking.entries ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    entries.slice(0, 10).forEach((entry, index) => {
      base.entries[index] = {
        rank: entry.rank,
        playerName: entry.playerName,
        countryCode: entry.countryCode ?? '',
        points: entry.points,
        playerImageUrl: entry.playerImageUrl ?? '',
        playerImageFile: null,
        imagePreviewUrl: entry.playerImageUrl ?? '',
      };
    });
    return {
      title: ranking.title,
      rankingDate: ranking.rankingDate ?? '',
      sourceUrl: ranking.sourceUrl ?? base.sourceUrl,
      isPublished: ranking.isPublished,
      entries: base.entries,
    };
  }

  private buildPayload(form: RankingForm): ReplaceFipRankingPayload | null {
    const title = form.title.trim();
    if (!title) {
      this.errorMessage = 'Le titre est obligatoire.';
      return null;
    }

    const filledEntries = form.entries
      .map((entry, index) => ({
        index,
        rank: Number(entry.rank),
        playerName: entry.playerName.trim(),
        countryCode: entry.countryCode.trim().toUpperCase(),
        points: entry.points === null ? NaN : Number(entry.points),
        playerImageUrl: entry.playerImageUrl.trim(),
        hasPlayerImageFile: !!entry.playerImageFile,
      }))
      .filter(
        (entry) =>
          !!entry.playerName ||
          !!entry.countryCode ||
          Number.isFinite(entry.points) ||
          !!entry.playerImageUrl ||
          entry.hasPlayerImageFile,
      );

    for (const entry of filledEntries) {
      if (!entry.playerName || !Number.isFinite(entry.points)) {
        this.errorMessage =
          'Chaque ligne renseignée doit avoir au moins un joueur et des points.';
        return null;
      }
      if (!Number.isInteger(entry.rank) || entry.rank < 1) {
        this.errorMessage = 'Chaque rang doit être un entier positif.';
        return null;
      }
      if (entry.points < 0) {
        this.errorMessage = 'Les points doivent être positifs ou nuls.';
        return null;
      }
    }

    if (form.isPublished && filledEntries.length !== 10) {
      this.errorMessage =
        'Un classement publié doit contenir exactement 10 lignes.';
      return null;
    }

    return {
      title,
      rankingDate: form.rankingDate || null,
      sourceUrl: form.sourceUrl.trim() || null,
      isPublished: form.isPublished,
      entries: filledEntries.map((entry) => ({
        sortOrder: entry.index,
        rank: entry.rank,
        playerName: entry.playerName,
        countryCode: entry.countryCode || null,
        points: entry.points,
        playerImageUrl: entry.playerImageUrl || null,
      })),
    };
  }

  private uploadPendingImages(
    form: RankingForm,
    payload: ReplaceFipRankingPayload,
  ): Observable<ReplaceFipRankingPayload> {
    const uploadTasks = payload.entries
      .map((entry, payloadIndex) => {
        const sourceIndex = entry.sortOrder;
        const file =
          typeof sourceIndex === 'number'
            ? form.entries[sourceIndex]?.playerImageFile
            : null;
        if (!file) {
          return null;
        }
        return this.fipRankingsService.uploadPlayerImage(file).pipe(
          map((url) => ({
            payloadIndex,
            url,
          })),
        );
      })
      .filter((task): task is Observable<{ payloadIndex: number; url: string }> => !!task);

    if (!uploadTasks.length) {
      return of(payload);
    }

    return forkJoin(uploadTasks).pipe(
      map((uploads) => {
        const entries = payload.entries.map((entry) => ({ ...entry }));
        for (const upload of uploads) {
          entries[upload.payloadIndex] = {
            ...entries[upload.payloadIndex],
            playerImageUrl: upload.url,
          };
        }
        return {
          ...payload,
          entries,
        };
      }),
    );
  }

  private parseApiError(error: unknown): string {
    const message = (error as { error?: { message?: string | string[] } })?.error
      ?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
    return 'Une erreur est survenue.';
  }
}
