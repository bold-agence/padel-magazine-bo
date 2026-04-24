import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-sidebar-widget',
  standalone: true,
  template: `
    <div
      class="mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]"
    >
      <h3 class="mb-2 font-semibold text-gray-900 dark:text-white">
        Admin Padel Magazine
      </h3>
      <p class="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
        Espace de gestion du contenu et des donnees.
      </p>
    </div>
  `,
})
export class AdminSidebarWidgetComponent {}
