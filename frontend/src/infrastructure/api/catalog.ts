// Catálogos de la API (contracts/api-catalogs.md). Funciones sin estado sobre http.ts.
import type { AlertType, DismissReason, Source, Team, User, Zone } from '../../domain/types';
import { http } from '../http';

export function getUsers() {
  return http.get<User[]>('/users');
}

export function getMe() {
  return http.get<User>('/me');
}

export function getZones() {
  return http.get<Zone[]>('/zones');
}

export function getTeams() {
  return http.get<Team[]>('/teams');
}

export function getAlertTypes() {
  return http.get<AlertType[]>('/alert-types');
}

export function getDismissReasons() {
  return http.get<DismissReason[]>('/dismiss-reasons');
}

export function getSources() {
  return http.get<Source[]>('/sources');
}
