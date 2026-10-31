// Stage-specific: loading the map + generated tilesets, levels, enemies, checks.
'use strict';
// Each tile has a type: 0=flat ground, 1=mossy top, 2=red beam, 3=mossy fill.
// IDs: ground (0), offscreen (98), water (99), ... Other ground and obstacles
const TILES={
  GRASS:[0,[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0