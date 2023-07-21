import * as React from 'react';
import {User as AppUser} from "@app/shared/types/core/user/user";
import {PropsWithChildren, useState} from "react";

const Anyone: AppUser = {
  displayName: 'Anyone',
  userId: '0299cda3-a2f7-4e94-9899-e1e37e5fe088',
  email: 'anyone@example.local',
  roles: ['Anyone']
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface OwnProps {

}

type UserProps = OwnProps & PropsWithChildren;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const UserContext = React.createContext({user: Anyone, setUser: (user: AppUser) => {}})

const User = (props: UserProps) => {
  const [user, setUser] = useState(Anyone);

  return <UserContext.Provider value={{user, setUser}}>
    {props.children}
  </UserContext.Provider>
};

export default User;
