export class MatrixUtils {
  static multiply(a: number[][], b: number[][]): number[][] {
    const result = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    return result;
  }

  static translation(dx: number, dy: number): number[][] {
    return [
      [1, 0, dx],
      [0, 1, dy],
      [0, 0, 1]
    ];
  }

  static rotation(angleDegrees: number): number[][] {
    const rad = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return [
      [cos, -sin, 0],
      [sin, cos, 0],
      [0, 0, 1]
    ];
  }

  static scaling(sx: number, sy: number): number[][] {
    return [
      [sx, 0, 0],
      [0, sy, 0],
      [0, 0, 1]
    ];
  }
  static identity(): number[][] {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  }

  static transformPoint(x: number, y: number, matrix: number[][]): {x: number, y: number} {
    const nx = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * 1;
    const ny = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * 1;
    // z ignorujemy (jest 1)
    return { x: nx, y: ny };
  }
}
