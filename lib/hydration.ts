const EXTENSION_ATTRIBUTES = ["bis_skin_checked", "bis_register"] as const

export function cleanupHydration(root: ParentNode = document) {
  for (const attribute of EXTENSION_ATTRIBUTES) {
    root.querySelectorAll(`[${attribute}]`).forEach((element) => {
      element.removeAttribute(attribute)
    })
  }
}
