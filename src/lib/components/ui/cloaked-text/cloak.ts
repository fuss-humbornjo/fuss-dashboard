export type CloakPosition = "start" | "end";

export type CloakOptions = {
  // Mark the hidden side with an ellipsis. Default true.
  ellipsis?: boolean;
  // Uppercase the visible slice. Default false.
  uppercase?: boolean;
  // Placeholder for the hidden side when ellipsis is on. Default "...".
  marker?: string;
};

// Masks all but `count` characters of `text`, keeping the slice at the `from`
// side. Returns `text` unchanged (modulo `uppercase`) when it already fits.
export const cloak = (
  text: string,
  count = 6,
  from: CloakPosition = "end",
  { ellipsis = true, uppercase = false, marker = "..." }: CloakOptions = {},
): string => {
  const slice =
    text.length <= count
      ? text
      : from === "end"
        ? text.slice(-count)
        : text.slice(0, count);
  const visible = uppercase ? slice.toUpperCase() : slice;
  if (!ellipsis || text.length <= count) return visible;
  return from === "end" ? `${marker}${visible}` : `${visible}${marker}`;
};
