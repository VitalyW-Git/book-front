import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("items", "routes/items.tsx"),
  route("*", "routes/404.tsx"),
] as RouteConfig;
