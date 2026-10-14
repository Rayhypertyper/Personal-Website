import { Vector3 } from "three";

const DEGREES_TO_RADIANS = Math.PI / 180;

export function latLonToVector3(
  latitude: number,
  longitude: number,
  radius = 1,
): Vector3 {
  // Three.js spheres map longitude 0° to +X and eastward longitude toward -Z.
  const polarAngle = (90 - latitude) * DEGREES_TO_RADIANS;
  const azimuthalAngle = (longitude + 180) * DEGREES_TO_RADIANS;

  return new Vector3(
    -radius * Math.sin(polarAngle) * Math.cos(azimuthalAngle),
    radius * Math.cos(polarAngle),
    radius * Math.sin(polarAngle) * Math.sin(azimuthalAngle),
  );
}
