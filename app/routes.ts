import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('jobs/new', 'routes/jobs.new.tsx'),
  route('jobs/:id/edit', 'routes/jobs.$id.edit.tsx'),
  route('formulas', 'routes/formulas.tsx'),
  route('formulas/new', 'routes/formulas.new.tsx'),
  route('formulas/:id/edit', 'routes/formulas.$id.edit.tsx'),
] satisfies RouteConfig
