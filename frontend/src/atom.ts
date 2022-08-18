import { useEffect } from "react";

import {
  atom,
  AtomEffect,
  atomFamily,
  SetterOrUpdater,
  useRecoilState,
  useSetRecoilState,
} from "recoil";
import { recoilPersist } from "recoil-persist";
import { User } from "../types/video";
const { persistAtom } = recoilPersist();
const ssrCompletedState = atom({
  key: "SsrCompleted",
  default: false,
});

export const useSsrComplectedState = (): boolean => {
  const [ssrCompleted, setSsrCompleted] =
    useRecoilState<boolean>(ssrCompletedState);

  useEffect(() => {
    if (!ssrCompleted) setSsrCompleted(true);
  }, [ssrCompleted]);
  return ssrCompleted;
};

export const persistAtomEffect = <T>(param: Parameters<AtomEffect<T>>[0]) => {
  param.getPromise(ssrCompletedState).then(() => persistAtom(param));
};
export const webSocketAtom = atomFamily({
  key: "ws",
  default: (url: string) => new WebSocket(url) || null,
});
export const usersAtom = atomFamily<User[], string>({
  key: "usersAtom",
  default: (room: string) => [],
});

export const useUser = (room: string) => {
  return useRecoilState(usersAtom(room));
};
