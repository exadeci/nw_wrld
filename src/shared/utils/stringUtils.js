export const formatModuleName = (name) => {
  if (!name || typeof name !== "string") return name;
  return name.replace(/([A-Z])/g, " $1").trim();
};
