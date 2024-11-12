import * as React from 'react';
import {User as AppUser} from "@app/shared/types/core/user/user";
import {PropsWithChildren, useEffect, useState} from "react";
import {PERSONA_STORAGE_KEY} from "@app/shared/extensions/personas";
import {environment} from "@frontend/environments/environment";
import {setPrototypePersonaHeader} from "@frontend/extensions/http/configured-axios";
import {initKeycloak} from "@frontend/keycloak/init-keycloak";
import {ParsedToken, parsedTokenToUser} from "@app/shared/utils/keycloak/parsed-token-to-user";
import {getConfiguredKeycloak} from "@frontend/keycloak/get-configured-keycloak";
import {Loading} from "mdi-material-ui";
import {useNavigate} from "react-router-dom";

const LAST_LOGIN_KEY = 'Cody_Last_Login'

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

const keycloakInstance = getConfiguredKeycloak();

const sessionPersonaStr = sessionStorage.getItem(PERSONA_STORAGE_KEY);

const defaultPersona = sessionPersonaStr ? JSON.parse(sessionPersonaStr) : Anyone;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const UserContext = React.createContext({user: defaultPersona, setUser: (user: AppUser) => {}})

if (environment.mode === "prototype") {
  setPrototypePersonaHeader(defaultPersona);
}

const User = (props: UserProps) => {
  const [user, setUser] = useState(defaultPersona);
  const [authenticated, setAuthenticated] = useState<boolean>(environment.mode !== "production-stack");
  const naviagte = useNavigate();

  useEffect(() => {
    if(environment.mode === "production-stack") {
      console.log("init keycloak");
      initKeycloak(() => {
        console.log("Authenticated!");
        const parsedToken = keycloakInstance.tokenParsed! || {};
        const newUser = parsedTokenToUser(parsedToken as ParsedToken, environment.keycloak.useAttributeRoles);
        setUser(newUser);
        setAuthenticated(true);
        const lastLogin = sessionStorage.getItem(LAST_LOGIN_KEY);

        if(lastLogin && lastLogin !== newUser.userId) {
          naviagte('/dashboard');
        }

        sessionStorage.setItem(LAST_LOGIN_KEY, newUser.userId);
      });
    }
  }, []);

  return <UserContext.Provider value={{user, setUser}}>
    {!authenticated && <Loading />}
    {authenticated && props.children}
  </UserContext.Provider>
};

export default User;
