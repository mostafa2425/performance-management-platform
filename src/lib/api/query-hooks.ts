"use client";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { adminApi, authApi, cyclesApi, employeesApi, metaApi, plansApi, resultsApi } from "./endpoints";

export const queryKeys = {
  me: ["auth","me"] as const, cycles: ["cycles"] as const, adminCycles: ["admin","cycles"] as const, employees: ["employees"] as const,
  plans: ["plans"] as const, results: ["results"] as const, policy: ["admin","policy"] as const, categories: ["admin","objective-categories"] as const,
  templates: ["admin","competency-templates"] as const, notifications: ["admin","notification-templates"] as const
};
export const useCurrentUser = (enabled = true) => useQuery({ queryKey: queryKeys.me, queryFn: authApi.me, enabled, retry: false });
export const useCycles = () => useQuery({ queryKey: queryKeys.cycles, queryFn: cyclesApi.mine });
export const useAdminCycles = (params: any = {}) => useQuery({ queryKey: [...queryKeys.adminCycles, params], queryFn: () => cyclesApi.adminList(params) });
export const useEmployees = (params: any = {}, enabled = true) => useQuery({ queryKey: [...queryKeys.employees, params], queryFn: () => employeesApi.list(params), enabled });
export const usePlans = (params: any = {}) => useQuery({ queryKey: [...queryKeys.plans, params], queryFn: () => plansApi.list(params) });
export const usePlan = (id: number | string, enabled = true) => useQuery({ queryKey: [...queryKeys.plans, id], queryFn: () => plansApi.get(id), enabled: enabled && Boolean(id) });
export const usePlanEvaluation = (id: number | string, enabled = true) => useQuery({ queryKey: ["plans",id,"evaluation"], queryFn: () => plansApi.evaluation(id), enabled: enabled && Boolean(id) });
export const useResults = (cycle?: number | string) => useQuery({ queryKey: [...queryKeys.results,cycle], queryFn: () => resultsApi.list(cycle) });
export const useMyResults = (cycle?: number | string) => useQuery({ queryKey: ["results","me",cycle], queryFn: () => resultsApi.mine(cycle) });
export const useKpiUnits = () => useQuery({ queryKey: ["meta","kpi-units"], queryFn: metaApi.kpiUnits });
export const useObjectiveCategories = () => useQuery({ queryKey: ["meta","objective-categories"], queryFn: metaApi.objectiveCategories });
export const usePolicy = () => useQuery({ queryKey: queryKeys.policy, queryFn: adminApi.policy });
export const useCompetencyTemplates = () => useQuery({ queryKey: queryKeys.templates, queryFn: adminApi.competencyTemplates });
export const useNotificationTemplates = () => useQuery({ queryKey: queryKeys.notifications, queryFn: adminApi.notificationTemplates });
export function useApiMutation<TData, TVariables>(mutationFn: (variables: TVariables) => Promise<TData>, invalidate: QueryKey[] = []) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: async () => { await Promise.all(invalidate.map(queryKey => queryClient.invalidateQueries({ queryKey }))); } });
}
export const useLoginMutation = () => useApiMutation(authApi.login, [queryKeys.me]);
export const useLogoutMutation = () => useApiMutation(authApi.logout, [queryKeys.me]);
export const useCreateCycleMutation = () => useApiMutation(cyclesApi.create, [queryKeys.adminCycles,queryKeys.cycles]);
export const useSavePlanMutation = () => useApiMutation(({id,body}: {id: number|string; body: any}) => plansApi.saveContent(id,body), [queryKeys.plans]);
export const useTransitionPlanMutation = () => useApiMutation(({id,action,body}: {id: number|string; action: string; body: any}) => plansApi.transition(id,action,body), [queryKeys.plans]);
export const useSaveEvaluationMutation = () => useApiMutation(({id,body}: {id: number|string; body: any}) => plansApi.saveEvaluation(id,body), [queryKeys.plans]);
export const useSubmitGroupMutation = () => useApiMutation(cyclesApi.submitGroup, [queryKeys.cycles]);