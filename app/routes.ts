import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("jobs/new", "routes/jobs.new.tsx"),
] satisfies RouteConfig;
