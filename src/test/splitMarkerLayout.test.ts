import { describe, expect, it } from 'vitest';
import {
    getNonOverlappingSplitMarkerOffsets,
    getSplitMarkerGroups,
    type ScreenPoint,
} from '../utils/splitMarkerLayout';

const distanceToSegment = (point: ScreenPoint, start: ScreenPoint, end: ScreenPoint): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const projection =
        lengthSquared === 0
            ? 0
            : Math.max(
                  0,
                  Math.min(
                      1,
                      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared
                  )
              );
    return Math.hypot(
        point.x - (start.x + projection * dx),
        point.y - (start.y + projection * dy)
    );
};

describe('getNonOverlappingSplitMarkerOffsets', () => {
    it('spaces nearby markers clear of the track and one another', () => {
        const targets = [
            { x: 150, y: 100 },
            { x: 150, y: 100 },
            { x: 154, y: 100 },
        ];
        const path = [{ x: 12, y: 100 }, { x: 288, y: 100 }];
        const mapSize = { x: 300, y: 200 };

        const offsets = getNonOverlappingSplitMarkerOffsets(targets, path, mapSize);
        const centers = offsets.flatMap((offset, index) =>
            offset
                ? [{ x: targets[index].x + offset.x, y: targets[index].y + offset.y }]
                : []
        );

        expect(centers).toHaveLength(targets.length);
        centers.forEach(center => {
            expect(center.x).toBeGreaterThanOrEqual(11);
            expect(center.x).toBeLessThanOrEqual(mapSize.x - 11);
            expect(center.y).toBeGreaterThanOrEqual(11);
            expect(center.y).toBeLessThanOrEqual(mapSize.y - 11);
            expect(distanceToSegment(center, path[0], path[1])).toBeGreaterThanOrEqual(16);
        });

        for (let first = 0; first < centers.length; first++) {
            for (let second = first + 1; second < centers.length; second++) {
                expect(Math.hypot(
                    centers[first].x - centers[second].x,
                    centers[first].y - centers[second].y
                )).toBeGreaterThanOrEqual(26);
            }
        }
    });

    it('leaves off-screen or unplaceable markers unplaced instead of overlapping', () => {
        const offsets = getNonOverlappingSplitMarkerOffsets(
            [{ x: 5, y: 5 }, { x: 50, y: 50 }],
            [{ x: 0, y: 0 }],
            { x: 10, y: 10 }
        );

        expect(offsets).toEqual([null, null]);
    });
});

describe('getSplitMarkerGroups', () => {
    it('clusters only the markers that do not fit without overlapping', () => {
        const targets = Array.from({ length: 5 }, () => ({ x: 25, y: 25 }));
        const groups = getSplitMarkerGroups(targets, [{ x: 25, y: 25 }], {
            x: 50,
            y: 50,
        });

        expect(groups.reduce((count, group) => count + group.indexes.length, 0)).toBe(5);
        expect(groups.some(group => group.indexes.length > 1)).toBe(true);
        expect(groups.every(group => group.offset !== null)).toBe(true);

        const centers = groups.map(group => ({
            x: group.target.x + group.offset!.x,
            y: group.target.y + group.offset!.y,
        }));
        centers.forEach(center => {
            expect(distanceToSegment(center, { x: 25, y: 25 }, { x: 25, y: 25 })).toBeGreaterThanOrEqual(
                16
            );
        });
        for (let first = 0; first < centers.length; first++) {
            for (let second = first + 1; second < centers.length; second++) {
                expect(Math.hypot(
                    centers[first].x - centers[second].x,
                    centers[first].y - centers[second].y
                )).toBeGreaterThanOrEqual(26);
            }
        }
    });

    it('keeps an unplaceable cluster available for a non-map fallback', () => {
        const groups = getSplitMarkerGroups(
            [{ x: 20, y: 20 }, { x: 20, y: 20 }],
            [{ x: 0, y: 20 }, { x: 40, y: 20 }],
            { x: 40, y: 40 }
        );

        expect(groups).toHaveLength(1);
        expect(groups[0].indexes).toEqual([0, 1]);
        expect(groups[0].offset).toBeNull();
    });
});
