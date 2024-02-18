import * as React from 'react';
import {User as AppUser} from "@app/shared/types/core/user/user";
import {PropsWithChildren, useState} from "react";
import {PERSONA_STORAGE_KEY} from "@app/shared/extensions/personas";
import {environment} from "@frontend/environments/environment";
import {setPrototypePersonaHeader} from "@frontend/extensions/http/configured-axios";

const Anyone: AppUser = {
  displayName: 'Anyone',
  userId: '0299cda3-a2f7-4e94-9899-e1e37e5fe088',
  email: 'anyone@example.local',
  roles: ['Anyone'],
  attributes: {}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface OwnProps {

}

type UserProps = OwnProps & PropsWithChildren;

const sessionPersonaStr = sessionStorage.getItem(PERSONA_STORAGE_KEY);

const defaultPersona = sessionPersonaStr ? JSON.parse(sessionPersonaStr) : Anyone;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const UserContext = React.createContext({user: defaultPersona, setUser: (user: AppUser) => {}})

if (environment.mode === "prototype") {
  setPrototypePersonaHeader(defaultPersona);
}

const User = (props: UserProps) => {
  const [user, setUser] = useState(defaultPersona);

  return <UserContext.Provider value={{user, setUser}}>
    {props.children}
  </UserContext.Provider>
};

export default User;
