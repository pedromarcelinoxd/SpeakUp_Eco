/**
 * Registro dos componentes Alpine das páginas do EcoRadar.
 */
import dashboardPage from './dashboard';
import miniMap from './miniMap';
import mapPage from './mapPage';
import reportForm from './reportForm';
import panoramaPage from './panorama';
import { reportDetail, reportsPage } from './reports';
import { pointDetail, pointsPage } from './points';
import { authPage, notificationsPage, profilePage, rankingPage, settingsPage } from './account';
import adminPage from './admin';

export function registerComponents(Alpine) {
    Alpine.data('dashboardPage', dashboardPage);
    Alpine.data('miniMap', miniMap);
    Alpine.data('mapPage', mapPage);
    Alpine.data('reportsPage', reportsPage);
    Alpine.data('reportDetail', reportDetail);
    Alpine.data('reportForm', reportForm);
    Alpine.data('pointsPage', pointsPage);
    Alpine.data('pointDetail', pointDetail);
    Alpine.data('rankingPage', rankingPage);
    Alpine.data('panoramaPage', panoramaPage);
    Alpine.data('profilePage', profilePage);
    Alpine.data('notificationsPage', notificationsPage);
    Alpine.data('settingsPage', settingsPage);
    Alpine.data('authPage', authPage);
    Alpine.data('adminPage', adminPage);
}
