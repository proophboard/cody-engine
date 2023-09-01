import {User} from "@app/shared/types/core/user/user";
// Ensure that webpack recompile is triggered when Cody adds a new role, see: https://github.com/TypeStrong/ts-loader/issues/697#issuecomment-433018970
import '@app/shared/types/core/user/user-role';

export type Persona = User & {description: string, color?: string};

export const PERSONA_STORAGE_KEY = 'ce_persona';
/**
 * Here you can define Personas used in the Prototyping Mode to simulate different user roles
 */
export const Personas: Persona[] = [
  {
    displayName: 'Anyone',
    userId: '0299cda3-a2f7-4e94-9899-e1e37e5fe088',
    email: 'anyone@example.local',
    roles: ['Anyone'],
    avatar: '/assets/account-circle-outline.svg',
    description: 'Anyone represents a standard user of the app without a specific role. This user has access to functionality that is not explicitly restricted.'
  }
];
