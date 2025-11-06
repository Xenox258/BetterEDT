import { createContext } from "react";
import { useProfiles } from "@/hooks/use-profiles";

type ProfilesContextType = ReturnType<typeof useProfiles>;

export const ProfilesContext = createContext<ProfilesContextType | undefined>(undefined);
