import { apiClient, apiGet, apiGetRaw, apiSend, apiSendRaw } from "./client";
export const authApi={login:async(body:{email:string;password:string})=>(await apiClient.post("/auth/login",body)).data,logout:()=>apiSend<void>("post","/auth/logout"),me:()=>apiGet<any>("/me")};
export const metaApi={kpiUnits:()=>apiGet<any>("/meta/kpi-units"),objectiveCategories:()=>apiGet<any[]>("/meta/objective-categories")};
export const employeesApi={list:(p:any={})=>apiGetRaw<any>("/employees",p),get:(id:number|string)=>apiGet<any>(`/employees/${id}`)};
export const cyclesApi={
 mine:()=>apiGet<any[]>("/cycles"),adminList:(p:any={})=>apiGetRaw<any>("/admin/cycles",p),adminGet:(id:number|string)=>apiGet<any>(`/admin/cycles/${id}`),
 create:(b:any)=>apiSend<any>("post","/admin/cycles",b),update:(id:number|string,b:any)=>apiSend<any>("patch",`/admin/cycles/${id}`,b),setScope:(id:number|string,b:any)=>apiSend<any>("put",`/admin/cycles/${id}/scope`,b),
 preview:(id:number|string,as_of?:string)=>apiGet<any>(`/admin/cycles/${id}/preview`,as_of?{as_of}:undefined),activate:(id:number|string)=>apiSendRaw<any>("post",`/admin/cycles/${id}/activate`),remove:(id:number|string)=>apiSend<void>("delete",`/admin/cycles/${id}`),
 updateStage:(id:number|string,stage:string,deadline_date:string)=>apiSend<any>("patch",`/admin/cycles/${id}/stages/${stage}`,{deadline_date}),members:(id:number|string,p:any={})=>apiGetRaw<any>(`/admin/cycles/${id}/members`,p),
 removeMember:(c:number|string,e:number|string,reason:string)=>apiSend<any>("delete",`/admin/cycles/${c}/members/${e}`,undefined,{reason}),planStatus:(id:number|string,p:any={})=>apiGetRaw<any>(`/cycles/${id}/plan-status`,p),
 teamEvaluations:(id:number|string,manager_id?:number)=>apiGetRaw<any>(`/cycles/${id}/team-evaluations`,manager_id?{manager_id}:undefined),group:(id:number|string,manager_id?:number)=>apiGet<any>(`/cycles/${id}/group`,manager_id?{manager_id}:undefined),
 submitGroup:(id:number|string)=>apiSend<any>("post",`/cycles/${id}/group/submit`)
};
export const plansApi={
 list:(p:any={})=>apiGetRaw<any>("/plans",p),get:(id:number|string)=>apiGet<any>(`/plans/${id}`),create:(cycle_member_id:number)=>apiSend<any>("post","/plans",{cycle_member_id}),
 saveContent:(id:number|string,b:any)=>apiSend<any>("put",`/plans/${id}/content`,b),transition:(id:number|string,a:string,b:any)=>apiSend<any>("post",`/plans/${id}/transitions/${a}`,b),
 history:(id:number|string)=>apiGet<any[]>(`/plans/${id}/history`),snapshots:(id:number|string)=>apiGet<any[]>(`/plans/${id}/snapshots`),remove:(id:number|string)=>apiSend<void>("delete",`/plans/${id}`),
 evaluation:(id:number|string)=>apiGet<any>(`/plans/${id}/evaluation`),saveEvaluation:(id:number|string,b:any)=>apiSend<any>("put",`/plans/${id}/evaluation`,b),
 uploadEvidence:async(p:number|string,k:number|string,file:File)=>{const form=new FormData();form.append("file",file);const r=await apiClient.post(`/plans/${p}/evaluation/kpis/${k}/evidence`,form);return r.data?.data??r.data;},
 downloadEvidence:async(p:number|string,e:number|string,name:string)=>{const r=await apiClient.get(`/plans/${p}/evaluation/evidence/${e}`,{responseType:"blob"});const url=URL.createObjectURL(r.data);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);},
 deleteEvidence:(p:number|string,e:number|string)=>apiSend<any>("delete",`/plans/${p}/evaluation/evidence/${e}`)
};
export const resultsApi={mine:(cycle?:number|string)=>apiGet<any[]>("/me/results",cycle?{cycle}:undefined),list:(cycle?:number|string)=>apiGet<any[]>("/results",cycle?{cycle}:undefined)};
export const adminApi={
 policy:()=>apiGet<any>("/admin/config/policy"),policyVersions:(p:any={})=>apiGetRaw<any>("/admin/config/policy/versions",p),previewPolicy:(b:any)=>apiSend<any>("post","/admin/config/policy/preview",b),savePolicy:(b:any)=>apiSend<any>("post","/admin/config/policy",b),
 competencyTemplates:()=>apiGet<any[]>("/admin/config/competency-templates"),unassignedJobTitles:()=>apiGet<any[]>("/admin/config/job-titles/unassigned"),createCompetencyTemplate:(b:any)=>apiSend<any>("post","/admin/config/competency-templates",b),
 competencyTemplate:(k:string)=>apiGet<any>(`/admin/config/competency-templates/${k}`),updateCompetencyTemplate:(k:string,b:any)=>apiSend<any>("put",`/admin/config/competency-templates/${k}`,b),templateVersions:(k:string)=>apiGet<any[]>(`/admin/config/competency-templates/${k}/versions`),
 attachJobTitles:(k:string,job_title_ids:number[])=>apiSend<any>("put",`/admin/config/competency-templates/${k}/job-titles`,{job_title_ids}),deleteCompetencyTemplate:(k:string)=>apiSend<void>("delete",`/admin/config/competency-templates/${k}`),
 objectiveCategories:(p:any={})=>apiGetRaw<any>("/admin/config/objective-categories",p),createObjectiveCategory:(b:any)=>apiSend<any>("post","/admin/config/objective-categories",b),updateObjectiveCategory:(id:number,b:any)=>apiSend<any>("patch",`/admin/config/objective-categories/${id}`,b),deleteObjectiveCategory:(id:number)=>apiSend<void>("delete",`/admin/config/objective-categories/${id}`),
 notificationTemplates:()=>apiGet<any[]>("/admin/config/notification-templates"),notificationTemplate:(c:string)=>apiGet<any>(`/admin/config/notification-templates/${c}`),updateNotificationTemplate:(c:string,b:any)=>apiSend<any>("put",`/admin/config/notification-templates/${c}`,b),
 exclusionCategories:()=>apiGet<any[]>("/admin/eligibility/exclusion-categories"),eligibilityAttributes:()=>apiGet<any[]>("/admin/eligibility/attributes"),exclusionRules:(p:any={})=>apiGetRaw<any>("/admin/eligibility/exclusion-rules",p),
 createExclusionRule:(b:any)=>apiSend<any>("post","/admin/eligibility/exclusion-rules",b),updateExclusionRule:(id:number,b:any)=>apiSend<any>("patch",`/admin/eligibility/exclusion-rules/${id}`,b),deleteExclusionRule:(id:number)=>apiSend<void>("delete",`/admin/eligibility/exclusion-rules/${id}`),
 overrides:(p:any={})=>apiGetRaw<any>("/admin/eligibility/overrides",p),createOverride:(b:any)=>apiSend<any>("post","/admin/eligibility/overrides",b),deleteOverride:(id:number)=>apiSend<void>("delete",`/admin/eligibility/overrides/${id}`),
 employeeEligibility:(id:number,as_of?:string)=>apiGet<any>(`/admin/eligibility/employees/${id}/eligibility`,as_of?{as_of}:undefined),
 groups:(c:number,p:any={})=>apiGetRaw<any>(`/admin/cycles/${c}/groups`,p),group:(id:number)=>apiGet<any>(`/admin/groups/${id}`),approveGroup:(id:number,v:number)=>apiSend<any>("post",`/admin/groups/${id}/approve`,{expected_version:v}),returnGroup:(id:number,b:any)=>apiSend<any>("post",`/admin/groups/${id}/return`,b),
 syncRuns:(p:any={})=>apiGetRaw<any>("/admin/sync-runs",p),syncIssues:(id:number,p:any={})=>apiGetRaw<any>(`/admin/sync-runs/${id}/issues`,p),grantAdmin:(id:number)=>apiSend<void>("post",`/admin/users/${id}/admin-grant`),revokeAdmin:(id:number)=>apiSend<void>("delete",`/admin/users/${id}/admin-grant`)
};