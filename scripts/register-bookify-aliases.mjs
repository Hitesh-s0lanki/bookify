import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, "src");
const serverOnlyStubUrl = pathToFileURL(
  path.join(projectRoot, "scripts", "server-only-stub.mjs")
).href;
const extensions = [".ts", ".tsx", ".js", ".mjs"];

function resolveAliasTarget(specifier) {
  if (!specifier.startsWith("@/")) {
    return null;
  }

  const relativePath = specifier.slice(2);
  const basePath = path.join(srcRoot, relativePath);

  for (const extension of extensions) {
    const filePath = `${basePath}${extension}`;
    if (existsSync(filePath)) {
      return pathToFileURL(filePath).href;
    }
  }

  for (const extension of extensions) {
    const indexPath = path.join(basePath, `index${extension}`);
    if (existsSync(indexPath)) {
      return pathToFileURL(indexPath).href;
    }
  }

  return null;
}

function resolveExtensionlessPath(specifier, parentURL) {
  if (
    !parentURL ||
    (!specifier.startsWith("./") &&
      !specifier.startsWith("../") &&
      !specifier.startsWith("/"))
  ) {
    return null;
  }

  const parentPath = fileURLToPath(parentURL);
  if (
    !parentPath.startsWith(projectRoot) ||
    parentPath.includes(`${path.sep}node_modules${path.sep}`)
  ) {
    return null;
  }

  const basePath = specifier.startsWith("/")
    ? specifier
    : path.resolve(path.dirname(parentPath), specifier);

  if (path.extname(basePath)) {
    return null;
  }

  for (const extension of extensions) {
    const filePath = `${basePath}${extension}`;
    if (existsSync(filePath)) {
      return pathToFileURL(filePath).href;
    }
  }

  for (const extension of extensions) {
    const indexPath = path.join(basePath, `index${extension}`);
    if (existsSync(indexPath)) {
      return pathToFileURL(indexPath).href;
    }
  }

  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return nextResolve(serverOnlyStubUrl, context);
    }

    if (specifier.startsWith("@/")) {
      const target = resolveAliasTarget(specifier);
      if (target) {
        return nextResolve(target, context);
      }
    }

    const extensionlessTarget = resolveExtensionlessPath(
      specifier,
      context.parentURL
    );
    if (extensionlessTarget) {
      return nextResolve(extensionlessTarget, context);
    }

    return nextResolve(specifier, context);
  },
});
