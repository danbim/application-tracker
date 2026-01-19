import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("jobs/new", "routes/jobs.new.tsx"),
  route("jobs/:id/edit", "routes/jobs.$id.edit.tsx"),
  route("formulas", "routes/formulas.tsx"),
] satisfies RouteConfig;
