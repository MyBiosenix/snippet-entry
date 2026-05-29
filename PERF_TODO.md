# Performance Todo

1. Trim heavy user list payloads so admin/sub-admin dashboards do not fetch full `myerrors` arrays.
2. Cache snippet IDs in the backend so `/api/snippet/next/:userId` does not scan the snippets collection on every request.
3. Remove duplicate user-side requests on the work page by reusing one lightweight profile/stats response.
4. Add missing MongoDB indexes for the most common filters: `isActive`, `date`, `admin`, and `packages`.
5. Verify with frontend build and backend smoke checks.
