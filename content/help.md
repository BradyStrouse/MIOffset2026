# Help

Using MI OFFSET 2026, step by step.

## Getting started

MI OFFSET estimates how far away from an odor source someone must be before odor is noticeable no
more than 1.5%, 3% or 5% of the time. It reports that distance separately for each of the 16
compass directions, which is why the result is drawn as a radial plot rather than a single circle.

Working through the tool takes three steps:

1. **Place your buildings on the map.** Each animal housing structure and each manure storage is
   placed individually at its own location.
2. **Describe each building.** Animal species, production type, housing or storage type, and size.
3. **Read and save your results.** Review the odor footprint and the setback distance table, then
   download or share them.

You do not need an account, and nothing you enter is stored on a server. Your work travels in the
page address, so bookmarking or copying the link is how you save a site for later.

> **This tool supports planning, not permitting.** While MI OFFSET 2026 is in beta, official
> decisions should continue to use the
> [2018 MI OFFSET application](https://legacy.enviroweather.msu.edu/legacy/mioffset/).

## Placing buildings on the map

### Finding your site

Before any buildings are placed, the map offers an address search. Enter the farm address, a
nearby crossroads, or a township to move the map to the right area. Switching to the satellite
basemap makes it much easier to see individual structures.

Zoom in far enough that you can distinguish one building from another. The setback distances are
sensitive to where each structure actually sits, so placement accuracy matters.

### Adding a structure

Drag a building from the palette onto the map, or click the map to drop one at that point. Each
structure you add becomes its own entry - a barn, a lagoon, and a second barn are three separate
buildings, not one combined site.

Give each one a name. Names appear on the map, in the buildings table, and in anything you
download, and they are the fastest way to tell two similar structures apart later.

### Moving and removing

A placed building can be dragged to a new position at any time; its coordinates update as you
move it. Use the recenter button to bring the map back to your buildings if you have panned away.

Coordinates are recorded to six decimal places, matching the MI OFFSET 2018 Centroid Worksheet.
If you already have surveyed coordinates for a structure, entering them directly is more accurate
than clicking the map.

### The odor source

You do not place the odor source yourself. It is calculated from the buildings you have entered -
an emission-weighted centroid, so a large, high-emission structure pulls it more strongly than a
small one. Adding, moving, or resizing any building moves the source, and the footprint is drawn
from there.

## Entering building details

Every building is described in one of three ways. Choose the one that matches the structure.

### Animal housing

For a barn or other housing structure, enter the species, the production type, and the housing
type. Then give the **footprint of this building in square feet** - the ground area of the
structure itself, not the fenced area or the parcel.

Species, production type and housing type together determine the odor emission factor the model
applies, so it is worth matching them as closely as your operation allows.

### Manure storage

For a lagoon, basin, tank or other storage, choose the storage type and enter the **surface area
of this storage in square feet** - the exposed liquid or solid surface, since that is the surface
odor leaves from. A covered storage uses a different storage type rather than a reduced area.

### Manual entry

Manual entry accepts an odor emission number directly, for structures the standard categories do
not cover or where you have a measured value to use instead. Use it sparingly; the built-in
factors are what the published model is based on.

### Checking your entries

The buildings table lists everything you have entered, with columns arranged to match the
MI OFFSET 2018 Centroid Worksheet. If you are transferring a site from that spreadsheet, you can
read down the two side by side.

Results update as you go. If the map has not caught up with a change, the footprint is redrawn
once the entry is complete.

## Reading and saving your results

### Reading the footprint

The footprint is three nested contours drawn around the calculated odor source. Each one answers
the same question at a different threshold: **how far away must a location be before odor is
noticeable no more than this share of the time?**

- The **1.5%** contour is the largest. Tolerating odor less often means standing further away.
- The **3%** contour sits inside it.
- The **5%** contour is the smallest.

Because prevailing winds carry odor further in some directions than others, the contours are not
circles. A neighbor directly downwind of the prevailing wind needs more distance than one the same
number of feet away in another direction.

The setback distance table gives the same information as numbers, one row per compass direction,
which is what you will want for a written record.

### Saving and sharing

The Save page collects everything for a site:

- **PDF** - the map with the footprint drawn on it, plus the full setback distance table. This is
  the version to print or attach.
- **KML** - opens the footprint in Google Earth or another mapping program.
- **Shapefile** - a GIS layer of the footprint and the source location, for use in county or
  township GIS.

The page address also carries your entire site - every building, its position, and its details. Copy
the link to save a site for later or send it to someone else; opening it restores the site exactly.
Nothing is stored on a server, so that link is the only copy.
