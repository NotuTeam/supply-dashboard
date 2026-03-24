/** @format */

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import AxiosClient from "@/lib/axios";
import { useGlobalState } from "@/lib/middleware";
import { LocalToken, LocalRefreshToken } from "@/lib/var";
import toast from "react-hot-toast";
import { User } from "@/interface/type";

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

export function useLogin() {
  const router = useRouter();
  const { actions } = useGlobalState();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await AxiosClient.post<LoginResponse>(
        "/auth/login",
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.accessToken) {
        localStorage.setItem(LocalToken, data.accessToken);
        actions.setAuth(data.user, data.accessToken);
        toast.success("Login successful");
        router.push("/");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const { actions } = useGlobalState();

  return useMutation({
    mutationFn: async () => {
      try {
        await AxiosClient.post("/auth/logout");
      } catch (error) {
        // Continue with logout even if API fails
      }
    },
    onSuccess: () => {
      localStorage.removeItem(LocalToken);
      localStorage.removeItem(LocalRefreshToken);
      actions.logout();
      router.push("/login");
    },
    onError: () => {
      localStorage.removeItem(LocalToken);
      localStorage.removeItem(LocalRefreshToken);
      actions.logout();
      router.push("/login");
    },
  });
}
