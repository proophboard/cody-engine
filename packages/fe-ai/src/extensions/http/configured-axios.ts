import axios from "axios";
import {User} from "@app/shared/types/core/user/user";

export const configuredAxios = axios.create({
});


export const setPrototypePersonaHeader = (user: User) => {
  configuredAxios.defaults.headers['Ce-User'] = user.userId;
}
