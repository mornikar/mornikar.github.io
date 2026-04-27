/**
 * InfiniteMenu - Vanilla JS / WebGL2 3D Sphere Menu
 * Ported from ReactBits (https://reactbits.dev/components/infinite-menu)
 * React wrapper removed, converted to vanilla JS for Hexo static blog.
 *
 * Dependencies: gl-matrix (dynamically imported from CDN)
 */
(async function () {
  'use strict';

  // ── Guard: only run on the infinite-menu page ──
  if (!document.getElementById('infinite-menu-mount')) return;

  // ── Dynamic import gl-matrix from CDN ──
  const glMatrix = await import('https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm');
  const { mat4, quat, vec2, vec3 } = glMatrix;

  // ═══════════════════════════════════════════════
  //  Geometry Helpers
  // ═══════════════════════════════════════════════

  class Face {
    constructor(a, b, c) { this.a = a; this.b = b; this.c = c; }
  }

  class Vertex {
    constructor(x, y, z) {
      this.position = vec3.fromValues(x, y, z);
      this.normal = vec3.create();
      this.uv = vec2.create();
    }
  }

  class Geometry {
    constructor() { this.vertices = []; this.faces = []; }

    addVertex(...args) {
      for (let i = 0; i < args.length; i += 3)
        this.vertices.push(new Vertex(args[i], args[i + 1], args[i + 2]));
      return this;
    }

    addFace(...args) {
      for (let i = 0; i < args.length; i += 3)
        this.faces.push(new Face(args[i], args[i + 1], args[i + 2]));
      return this;
    }

    get lastVertex() { return this.vertices[this.vertices.length - 1]; }

    subdivide(divisions = 1) {
      const midPointCache = {};
      let f = this.faces;
      for (let div = 0; div < divisions; ++div) {
        const newFaces = new Array(f.length * 4);
        f.forEach((face, ndx) => {
          const mAB = this.getMidPoint(face.a, face.b, midPointCache);
          const mBC = this.getMidPoint(face.b, face.c, midPointCache);
          const mCA = this.getMidPoint(face.c, face.a, midPointCache);
          const i = ndx * 4;
          newFaces[i]     = new Face(face.a, mAB, mCA);
          newFaces[i + 1] = new Face(face.b,  mBC, mAB);
          newFaces[i + 2] = new Face(face.c,  mCA, mBC);
          newFaces[i + 3] = new Face(mAB, mBC, mCA);
        });
        f = newFaces;
      }
      this.faces = f;
      return this;
    }

    spherize(radius = 1) {
      this.vertices.forEach(v => {
        vec3.normalize(v.normal, v.position);
        vec3.scale(v.position, v.normal, radius);
      });
      return this;
    }

    get data() {
      return {
        vertices: this.vertexData,
        indices:  this.indexData,
        normals:  this.normalData,
        uvs:      this.uvData
      };
    }
    get vertexData() { return new Float32Array(this.vertices.flatMap(v => Array.from(v.position))); }
    get normalData() { return new Float32Array(this.vertices.flatMap(v => Array.from(v.normal))); }
    get uvData()     { return new Float32Array(this.vertices.flatMap(v => Array.from(v.uv))); }
    get indexData()  { return new Uint16Array(this.faces.flatMap(f => [f.a, f.b, f.c])); }

    getMidPoint(ndxA, ndxB, cache) {
      const key = ndxA < ndxB ? `k_${ndxB}_${ndxA}` : `k_${ndxA}_${ndxB}`;
      if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key];
      const a = this.vertices[ndxA].position;
      const b = this.vertices[ndxB].position;
      const ndx = this.vertices.length;
      cache[key] = ndx;
      this.addVertex((a[0]+b[0])*0.5, (a[1]+b[1])*0.5, (a[2]+b[2])*0.5);
      return ndx;
    }
  }

  class IcosahedronGeometry extends Geometry {
    constructor() {
      super();
      const t = Math.sqrt(5) * 0.5 + 0.5;
      this.addVertex(
        -1, t, 0,   1, t, 0,   -1, -t, 0,   1, -t, 0,
         0, -1, t,   0, 1, t,    0, -1, -t,   0, 1, -t,
         t, 0, -1,   t, 0, 1,   -t, 0, -1,  -t, 0, 1
      ).addFace(
        0,11,5,  0,5,1,   0,1,7,   0,7,10,  0,10,11,
        1,5,9,   5,11,4,  11,10,2, 10,7,6,  7,1,8,
        3,9,4,   3,4,2,   3,2,6,   3,6,8,   3,8,9,
        4,9,5,   2,4,11,  6,2,10,  8,6,7,   9,8,1
      );
    }
  }

  class DiscGeometry extends Geometry {
    constructor(steps = 4, radius = 1) {
      super();
      steps = Math.max(4, steps);
      const alpha = (2 * Math.PI) / steps;
      this.addVertex(0, 0, 0);
      this.lastVertex.uv[0] = 0.5;
      this.lastVertex.uv[1] = 0.5;
      for (let i = 0; i < steps; ++i) {
        const x = Math.cos(alpha * i);
        const y = Math.sin(alpha * i);
        this.addVertex(radius * x, radius * y, 0);
        this.lastVertex.uv[0] = x * 0.5 + 0.5;
        this.lastVertex.uv[1] = y * 0.5 + 0.5;
        if (i > 0) this.addFace(0, i, i + 1);
      }
      this.addFace(0, steps, 1);
    }
  }

  // ═══════════════════════════════════════════════
  //  WebGL Helpers
  // ═══════════════════════════════════════════════

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.error('[InfiniteMenu] Shader error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  function createProgram(gl, sources, attribLocations) {
    const program = gl.createProgram();
    [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, ndx) => {
      const s = createShader(gl, type, sources[ndx]);
      if (s) gl.attachShader(program, s);
    });
    if (attribLocations) {
      for (const a in attribLocations) gl.bindAttribLocation(program, attribLocations[a], a);
    }
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    console.error('[InfiniteMenu] Program error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  function makeVertexArray(gl, bufLocNumElmPairs, indices) {
    const va = gl.createVertexArray();
    gl.bindVertexArray(va);
    for (const [buffer, loc, numElem] of bufLocNumElmPairs) {
      if (loc === -1) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, numElem, gl.FLOAT, false, 0, 0);
    }
    if (indices) {
      const ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }
    gl.bindVertexArray(null);
    return va;
  }

  function resizeCanvasToDisplaySize(canvas) {
    const dpr = Math.min(2, window.devicePixelRatio);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
    return false;
  }

  function makeBuffer(gl, sizeOrData, usage) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buf;
  }

  function createAndSetupTexture(gl, min, mag, ws, wt) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, ws);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag);
    return t;
  }

  // ═══════════════════════════════════════════════
  //  Arcball Control
  // ═══════════════════════════════════════════════

  class ArcballControl {
    isPointerDown = false;
    orientation = quat.create();
    pointerRotation = quat.create();
    rotationVelocity = 0;
    rotationAxis = vec3.fromValues(1, 0, 0);
    snapDirection = vec3.fromValues(0, 0, -1);
    snapTargetDirection;
    EPSILON = 0.1;
    IDENTITY_QUAT = quat.create();

    constructor(canvas, cb) {
      this.canvas = canvas;
      this.updateCallback = cb || (() => {});
      this.pointerPos = vec2.create();
      this.previousPointerPos = vec2.create();
      this._rotationVelocity = 0;
      this._combinedQuat = quat.create();

      canvas.addEventListener('pointerdown', e => {
        vec2.set(this.pointerPos, e.clientX, e.clientY);
        vec2.copy(this.previousPointerPos, this.pointerPos);
        this.isPointerDown = true;
      });
      canvas.addEventListener('pointerup',    () => { this.isPointerDown = false; });
      canvas.addEventListener('pointerleave', () => { this.isPointerDown = false; });
      canvas.addEventListener('pointermove', e => {
        if (this.isPointerDown) vec2.set(this.pointerPos, e.clientX, e.clientY);
      });
      canvas.style.touchAction = 'none';
    }

    update(dt, tfd = 16) {
      const ts = dt / tfd + 0.00001;
      let af = ts;
      let snapRot = quat.create();

      if (this.isPointerDown) {
        const INT = 0.3 * ts, AMP = 5 / ts;
        const mid = vec2.sub(vec2.create(), this.pointerPos, this.previousPointerPos);
        vec2.scale(mid, mid, INT);
        if (vec2.sqrLen(mid) > this.EPSILON) {
          vec2.add(mid, this.previousPointerPos, mid);
          const p = this._project(mid), q = this._project(this.previousPointerPos);
          const a = vec3.normalize(vec3.create(), p), b = vec3.normalize(vec3.create(), q);
          vec2.copy(this.previousPointerPos, mid);
          af *= AMP;
          this._quatFromVecs(a, b, this.pointerRotation, af);
        } else {
          quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, INT);
        }
      } else {
        const INT = 0.1 * ts;
        quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, INT);
        if (this.snapTargetDirection) {
          const SI = 0.2;
          const a = this.snapTargetDirection, b = this.snapDirection;
          const sq = vec3.squaredDistance(a, b);
          af *= SI * Math.max(0.1, 1 - sq * 10);
          this._quatFromVecs(a, b, snapRot, af);
        }
      }

      const combined = quat.multiply(quat.create(), snapRot, this.pointerRotation);
      this.orientation = quat.multiply(quat.create(), combined, this.orientation);
      quat.normalize(this.orientation, this.orientation);

      const RI = 0.8 * ts;
      quat.slerp(this._combinedQuat, this._combinedQuat, combined, RI);
      quat.normalize(this._combinedQuat, this._combinedQuat);

      const rad = Math.acos(this._combinedQuat[3]) * 2;
      const s = Math.sin(rad / 2);
      let rv = 0;
      if (s > 0.000001) {
        rv = rad / (2 * Math.PI);
        this.rotationAxis[0] = this._combinedQuat[0] / s;
        this.rotationAxis[1] = this._combinedQuat[1] / s;
        this.rotationAxis[2] = this._combinedQuat[2] / s;
      }
      this._rotationVelocity += (rv - this._rotationVelocity) * 0.5 * ts;
      this.rotationVelocity = this._rotationVelocity / ts;
      this.updateCallback(dt);
    }

    _quatFromVecs(a, b, out, af = 1) {
      const axis = vec3.cross(vec3.create(), a, b);
      vec3.normalize(axis, axis);
      const d = Math.max(-1, Math.min(1, vec3.dot(a, b)));
      quat.setAxisAngle(out, axis, Math.acos(d) * af);
    }

    _project(pos) {
      const r = 2, w = this.canvas.clientWidth, h = this.canvas.clientHeight, s = Math.max(w, h) - 1;
      const x = (2 * pos[0] - w - 1) / s, y = (2 * pos[1] - h - 1) / s;
      const xy2 = x*x + y*y, r2 = r*r;
      const z = xy2 <= r2/2 ? Math.sqrt(r2 - xy2) : r2 / Math.sqrt(xy2);
      return vec3.fromValues(-x, y, z);
    }
  }

  // ═══════════════════════════════════════════════
  //  Shaders
  // ═══════════════════════════════════════════════

  const VERT = `#version 300 es
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;

in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;

#define PI 3.141593

void main() {
  vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);
  vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0.,0.,0.,1.)).xyz;
  float radius = length(centerPos.xyz);
  if (gl_VertexID > 0) {
    vec3 rotationAxis = uRotationAxisVelocity.xyz;
    float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
    vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
    vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
    float strength = dot(stretchDir, relativeVertexPos);
    float invAbsStrength = min(0., abs(strength) - 1.);
    strength = rotationVelocity * sign(strength) * abs(invAbsStrength*invAbsStrength*invAbsStrength + 1.);
    worldPosition.xyz += stretchDir * strength;
  }
  worldPosition.xyz = radius * normalize(worldPosition.xyz);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
  vUvs = aModelUvs;
  vInstanceId = gl_InstanceID;
}`;

  const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;
out vec4 outColor;
in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;

void main() {
  int itemIndex = vInstanceId % uItemCount;
  int cellsPerRow = uAtlasSize;
  int cellX = itemIndex % cellsPerRow;
  int cellY = itemIndex / cellsPerRow;
  vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
  vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;
  ivec2 texSize = textureSize(uTex, 0);
  float imageAspect = float(texSize.x) / float(texSize.y);
  float containerAspect = 1.0;
  float scale = max(imageAspect/containerAspect, containerAspect/imageAspect);
  vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
  st = (st - 0.5) * scale + 0.5;
  st = clamp(st, 0.0, 1.0);
  st = st * cellSize + cellOffset;
  outColor = texture(uTex, st);
  outColor.a *= vAlpha;
}`;

  // ═══════════════════════════════════════════════
  //  InfiniteGridMenu Core
  // ═══════════════════════════════════════════════

  class InfiniteGridMenu {
    TFD = 1000/60;
    SR = 2; // sphere radius
    _t = 0; _dt = 0; _df = 0; _f = 0;

    camera = {
      matrix: mat4.create(), near: 0.1, far: 40, fov: Math.PI/4, aspect: 1,
      position: vec3.fromValues(0, 0, 3), up: vec3.fromValues(0, 1, 0),
      matrices: { view: mat4.create(), projection: mat4.create(), inversProjection: mat4.create() }
    };

    nearestVertexIndex = null;
    smoothRV = 0;
    scaleFactor = 1.0;
    movementActive = false;

    constructor(canvas, items, onActive, onMove, onInit, scale) {
      this.canvas = canvas;
      this.items = items || [];
      this.onActiveItemChange = onActive || (() => {});
      this.onMovementChange = onMove || (() => {});
      this.scaleFactor = scale || 1.0;
      this.camera.position[2] = 3 * this.scaleFactor;
      this._init(onInit);
    }

    resize() {
      this.viewportSize = vec2.set(this.viewportSize || vec2.create(), this.canvas.clientWidth, this.canvas.clientHeight);
      const gl = this.gl;
      if (resizeCanvasToDisplaySize(gl.canvas)) gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this._updateProj(gl);
    }

    run(time = 0) {
      this._dt = Math.min(32, time - this._t);
      this._t = time;
      this._df = this._dt / this.TFD;
      this._f += this._df;
      this._animate(this._dt);
      this._render();
      this._raf = requestAnimationFrame(t => this.run(t));
    }

    destroy() {
      if (this._raf) cancelAnimationFrame(this._raf);
    }

    _init(onInit) {
      this.gl = this.canvas.getContext('webgl2', { antialias: true, alpha: false });
      const gl = this.gl;
      if (!gl) { console.error('[InfiniteMenu] WebGL2 not supported'); return; }

      this.viewportSize = vec2.fromValues(this.canvas.clientWidth, this.canvas.clientHeight);
      this.drawBufferSize = vec2.clone(this.viewportSize);

      this.discProg = createProgram(gl, [VERT, FRAG], {
        aModelPosition: 0, aModelNormal: 1, aModelUvs: 2, aInstanceMatrix: 3
      });

      this.discLoc = {
        aModelPosition:  gl.getAttribLocation(this.discProg, 'aModelPosition'),
        aModelUvs:       gl.getAttribLocation(this.discProg, 'aModelUvs'),
        aInstanceMatrix: gl.getAttribLocation(this.discProg, 'aInstanceMatrix'),
        uWorldMatrix:    gl.getUniformLocation(this.discProg, 'uWorldMatrix'),
        uViewMatrix:     gl.getUniformLocation(this.discProg, 'uViewMatrix'),
        uProjectionMatrix: gl.getUniformLocation(this.discProg, 'uProjectionMatrix'),
        uCameraPosition: gl.getUniformLocation(this.discProg, 'uCameraPosition'),
        uScaleFactor:    gl.getUniformLocation(this.discProg, 'uScaleFactor'),
        uRotationAxisVelocity: gl.getUniformLocation(this.discProg, 'uRotationAxisVelocity'),
        uTex:  gl.getUniformLocation(this.discProg, 'uTex'),
        uFrames: gl.getUniformLocation(this.discProg, 'uFrames'),
        uItemCount: gl.getUniformLocation(this.discProg, 'uItemCount'),
        uAtlasSize: gl.getUniformLocation(this.discProg, 'uAtlasSize')
      };

      const discGeo = new DiscGeometry(56, 1);
      const discBufs = discGeo.data;
      this.discIndexCount = discBufs.indices.length;
      this.discVAO = makeVertexArray(gl, [
        [makeBuffer(gl, discBufs.vertices, gl.STATIC_DRAW), this.discLoc.aModelPosition, 3],
        [makeBuffer(gl, discBufs.uvs, gl.STATIC_DRAW), this.discLoc.aModelUvs, 2]
      ], discBufs.indices);

      const icoGeo = new IcosahedronGeometry();
      icoGeo.subdivide(1).spherize(this.SR);
      this.instancePositions = icoGeo.vertices.map(v => v.position);
      this.DISC_INST_COUNT = icoGeo.vertices.length;
      this._initDiscInstances(this.DISC_INST_COUNT);

      this.worldMatrix = mat4.create();
      this._initTexture();

      this.control = new ArcballControl(this.canvas, dt => this._onCtrl(dt));
      this._updateCam();
      this._updateProj(gl);
      this.resize();

      if (onInit) onInit(this);
    }

    _initTexture() {
      const gl = this.gl;
      this.tex = createAndSetupTexture(gl, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
      const count = Math.max(1, this.items.length);
      this.atlasSize = Math.ceil(Math.sqrt(count));
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      const cell = 512;
      c.width = this.atlasSize * cell;
      c.height = this.atlasSize * cell;
      // Fill with dark background as placeholder
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, c.width, c.height);

      Promise.all(this.items.map(item =>
        new Promise(resolve => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = item.image;
        })
      )).then(images => {
        images.forEach((img, i) => {
          if (!img) return;
          const x = (i % this.atlasSize) * cell;
          const y = Math.floor(i / this.atlasSize) * cell;
          ctx.drawImage(img, x, y, cell, cell);
        });
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        gl.generateMipmap(gl.TEXTURE_2D);
      });
    }

    _initDiscInstances(count) {
      const gl = this.gl;
      this.discInst = {
        arr: new Float32Array(count * 16),
        mats: [],
        buf: gl.createBuffer()
      };
      for (let i = 0; i < count; ++i) {
        const slice = new Float32Array(this.discInst.arr.buffer, i * 16 * 4, 16);
        slice.set(mat4.create());
        this.discInst.mats.push(slice);
      }
      gl.bindVertexArray(this.discVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.discInst.buf);
      gl.bufferData(gl.ARRAY_BUFFER, this.discInst.arr.byteLength, gl.DYNAMIC_DRAW);
      for (let j = 0; j < 4; ++j) {
        const loc = this.discLoc.aInstanceMatrix + j;
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 64, j * 16);
        gl.vertexAttribDivisor(loc, 1);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindVertexArray(null);
    }

    _animate(dt) {
      const gl = this.gl;
      this.control.update(dt, this.TFD);
      const positions = this.instancePositions.map(p => vec3.transformQuat(vec3.create(), p, this.control.orientation));
      const scale = 0.25, SI = 0.6;
      positions.forEach((p, ndx) => {
        const s = (Math.abs(p[2]) / this.SR) * SI + (1 - SI);
        const fs = s * scale;
        const m = mat4.create();
        mat4.multiply(m, m, mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), p)));
        mat4.multiply(m, m, mat4.targetTo(mat4.create(), [0,0,0], p, [0,1,0]));
        mat4.multiply(m, m, mat4.fromScaling(mat4.create(), [fs, fs, fs]));
        mat4.multiply(m, m, mat4.fromTranslation(mat4.create(), [0, 0, -this.SR]));
        mat4.copy(this.discInst.mats[ndx], m);
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, this.discInst.buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.discInst.arr);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      this.smoothRV = this.control.rotationVelocity;
    }

    _render() {
      const gl = this.gl;
      gl.useProgram(this.discProg);
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.uniformMatrix4fv(this.discLoc.uWorldMatrix, false, this.worldMatrix);
      gl.uniformMatrix4fv(this.discLoc.uViewMatrix, false, this.camera.matrices.view);
      gl.uniformMatrix4fv(this.discLoc.uProjectionMatrix, false, this.camera.matrices.projection);
      gl.uniform3f(this.discLoc.uCameraPosition, ...this.camera.position);
      gl.uniform4f(this.discLoc.uRotationAxisVelocity,
        this.control.rotationAxis[0], this.control.rotationAxis[1],
        this.control.rotationAxis[2], this.smoothRV * 1.1);
      gl.uniform1i(this.discLoc.uItemCount, this.items.length);
      gl.uniform1i(this.discLoc.uAtlasSize, this.atlasSize);
      gl.uniform1f(this.discLoc.uFrames, this._f);
      gl.uniform1f(this.discLoc.uScaleFactor, this.scaleFactor);
      gl.uniform1i(this.discLoc.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);

      gl.bindVertexArray(this.discVAO);
      gl.drawElementsInstanced(gl.TRIANGLES, this.discIndexCount, gl.UNSIGNED_SHORT, 0, this.DISC_INST_COUNT);
    }

    _updateCam() {
      mat4.targetTo(this.camera.matrix, this.camera.position, [0,0,0], this.camera.up);
      mat4.invert(this.camera.matrices.view, this.camera.matrix);
    }

    _updateProj(gl) {
      this.camera.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const h = this.SR * 0.35, d = this.camera.position[2];
      this.camera.fov = this.camera.aspect > 1 ? 2*Math.atan(h/d) : 2*Math.atan(h/this.camera.aspect/d);
      mat4.perspective(this.camera.matrices.projection, this.camera.fov, this.camera.aspect, this.camera.near, this.camera.far);
      mat4.invert(this.camera.matrices.inversProjection, this.camera.matrices.projection);
    }

    _onCtrl(dt) {
      const ts = dt / this.TFD + 0.0001;
      let damp = 5 / ts, camZ = 3 * this.scaleFactor;
      const isMoving = this.control.isPointerDown || Math.abs(this.smoothRV) > 0.01;
      if (isMoving !== this.movementActive) { this.movementActive = isMoving; this.onMovementChange(isMoving); }
      if (!this.control.isPointerDown) {
        const ni = this._nearestVertex();
        const ii = ni % Math.max(1, this.items.length);
        this.onActiveItemChange(ii);
        this.control.snapTargetDirection = vec3.normalize(vec3.create(), this._vertexWorldPos(ni));
      } else {
        camZ += this.control.rotationVelocity * 80 + 2.5;
        damp = 7 / ts;
      }
      this.camera.position[2] += (camZ - this.camera.position[2]) / damp;
      this._updateCam();
    }

    _nearestVertex() {
      const n = this.control.snapDirection;
      const inv = quat.conjugate(quat.create(), this.control.orientation);
      const nt = vec3.transformQuat(vec3.create(), n, inv);
      let maxD = -1, idx;
      for (let i = 0; i < this.instancePositions.length; ++i) {
        const d = vec3.dot(nt, this.instancePositions[i]);
        if (d > maxD) { maxD = d; idx = i; }
      }
      return idx;
    }

    _vertexWorldPos(i) {
      return vec3.transformQuat(vec3.create(), this.instancePositions[i], this.control.orientation);
    }
  }

  // ═══════════════════════════════════════════════
  //  Mount & Init
  // ═══════════════════════════════════════════════

  const mount = document.getElementById('infinite-menu-mount');
  if (!mount) return;

  // Read items from data attribute or use defaults
  let items = [];
  try {
    const raw = mount.getAttribute('data-items');
    if (raw) items = JSON.parse(raw);
  } catch(e) { console.warn('[InfiniteMenu] Failed to parse data-items:', e); }

  if (!items.length) {
    items = [
      { image: 'https://picsum.photos/seed/blog1/900/900?grayscale', link: '/', title: '首页', description: '返回博客主页' },
      { image: 'https://picsum.photos/seed/blog2/900/900?grayscale', link: '/archives/', title: '归档', description: '浏览所有文章' },
      { image: 'https://picsum.photos/seed/blog3/900/900?grayscale', link: '/categories/', title: '分类', description: '按分类查看' },
      { image: 'https://picsum.photos/seed/blog4/900/900?grayscale', link: '/assets-archive/', title: '资源', description: '精选资源合集' },
      { image: 'https://picsum.photos/seed/blog5/900/900?grayscale', link: '/login/', title: 'AI 助手', description: 'Wiki AI Mornikar' },
      { image: 'https://picsum.photos/seed/blog6/900/900?grayscale', link: '/wiki-changelog/', title: '更新日志', description: '最新变更记录' },
    ];
  }

  const scale = parseFloat(mount.getAttribute('data-scale')) || 1.0;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'infinite-grid-menu-canvas';
  mount.appendChild(canvas);

  // Create overlay elements
  const overlay = document.createElement('div');
  overlay.className = 'infinite-menu-overlay';
  overlay.innerHTML = `
    <h2 class="face-title inactive"></h2>
    <p class="face-description inactive"></p>
    <div class="action-button inactive">
      <p class="action-button-icon">&#x2197;</p>
    </div>
  `;
  mount.appendChild(overlay);

  const titleEl = overlay.querySelector('.face-title');
  const descEl = overlay.querySelector('.face-description');
  const btnEl = overlay.querySelector('.action-button');

  let activeItem = null;

  function setActive(item) {
    activeItem = item;
    titleEl.textContent = item.title || '';
    descEl.textContent = item.description || '';
  }

  const menu = new InfiniteGridMenu(
    canvas,
    items,
    idx => { if (items[idx]) setActive(items[idx]); },
    moving => {
      const cls = moving ? 'inactive' : 'active';
      const rm = moving ? 'active' : 'inactive';
      [titleEl, descEl, btnEl].forEach(el => {
        if (el) { el.classList.remove(rm); el.classList.add(cls); }
      });
    },
    sk => sk.run(),
    scale
  );

  btnEl.addEventListener('click', () => {
    if (!activeItem || !activeItem.link) return;
    if (activeItem.link.startsWith('http')) {
      window.open(activeItem.link, '_blank');
    } else {
      window.location.href = activeItem.link;
    }
  });

  const onResize = () => menu.resize();
  window.addEventListener('resize', onResize);

  // Cleanup on pjax navigation
  document.addEventListener('pjax:send', () => {
    window.removeEventListener('resize', onResize);
    menu.destroy();
  }, { once: true });

})();
