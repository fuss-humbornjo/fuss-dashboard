export type Breadcrumb = { label: string; href?: string };

// Features deeper than the nav tree (e.g. /projects/<id>/sessions/<id>) push
// their resolved crumbs here so the header breadcrumb can replace in-page
// back buttons. Set on mount/update, cleared on unmount by the same feature.
export const featureCrumbs: { current: Breadcrumb[] | null } = $state({
  current: null,
});
