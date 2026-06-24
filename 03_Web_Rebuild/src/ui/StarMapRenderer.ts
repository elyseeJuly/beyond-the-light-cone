import { Star } from "../core/Star";
import { GameInstance } from "../core/Game";
import { StarArea } from "../types/enums";

interface RenderStar {
  star: Star;
  x: number;
  y: number;
  radius: number;
  orbitRadius: number;
  angle: number;
  speed: number;
  parentIndex?: number;
  offsetX?: number;
  offsetY?: number;
}

interface TouchState {
  active: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startDistance: number;
  startZoom: number;
  moved: boolean;
  startTime: number;
}

export class StarMapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private renderStars: RenderStar[] = [];
  private animationId: number = 0;
  
  public activeArea: StarArea = StarArea.SOLARSYSTEM;
  public hoveredStar: RenderStar | null = null;
  public selectedStar: RenderStar | null = null;

  public renderStarMap: Map<number, RenderStar> = new Map();

  public zoomLevel: number = 1.0;
  public panX: number = 0;
  public panY: number = 0;

  private distantGalaxies: { x: number; y: number; r: number; alpha: number }[] = [];

  public onStarClick: ((star: Star) => void) | null = null;

  // Touch interaction state
  private touch: TouchState = {
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startDistance: 0,
    startZoom: 1,
    moved: false,
    startTime: 0,
  };

  // ResizeObserver for responsive canvas sizing
  private resizeObserver: ResizeObserver | null = null;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    
    this.resize();
    this.generateDistantGalaxies();
    
    // Use ResizeObserver instead of window.resize for responsive sizing
    this.initResizeObserver();
    
    this.initMouseEvents();
    this.initTouchEvents();
  }

  private generateDistantGalaxies(): void {
    this.distantGalaxies = [];
    for (let i = 0; i < 300; i++) {
      this.distantGalaxies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: Math.random() * 1.8 + 0.2,
        alpha: Math.random() * 0.25 + 0.03,
      });
    }
  }

  // ==================== ResizeObserver ====================

  private initResizeObserver(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const newWidth = Math.floor(entry.contentRect.width);
          const newHeight = Math.floor(entry.contentRect.height);
          if (newWidth !== this.width || newHeight !== this.height) {
            this.width = newWidth;
            this.height = newHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.generateDistantGalaxies();
            // Re-fit content to the new canvas size (handles orientation change)
            this.fitContent();
          }
        }
      }
    });

    this.resizeObserver.observe(container);
  }

  private cleanupResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  // ==================== Zoom/Pan Controls ====================

  public zoomIn(): void {
    this.zoomLevel = Math.min(3.0, this.zoomLevel + 0.2);
    this.emitZoomChanged();
  }

  public zoomOut(): void {
    this.zoomLevel = Math.max(0.3, this.zoomLevel - 0.2);
    this.emitZoomChanged();
  }

  public resetView(): void {
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.emitZoomChanged();
  }

  /** Emit a custom event so React can read current zoom level */
  private emitZoomChanged(): void {
    window.dispatchEvent(new CustomEvent('starmap-zoom-changed', {
      detail: { zoom: this.zoomLevel, panX: this.panX, panY: this.panY }
    }));
  }

  public getZoomPercent(): number {
    return Math.round(this.zoomLevel * 100);
  }

  public setActiveArea(area: StarArea): void {
    this.activeArea = area;
    this.hoveredStar = null;
    this.selectedStar = null;
    
    if (area === StarArea.SOLARSYSTEM) {
      this.zoomLevel = 1.0;
    } else if (area === StarArea.LIGHTYEAR_50) {
      this.zoomLevel = 0.8;
    } else if (area === StarArea.LIGHTYEAR_1W) {
      this.zoomLevel = 0.6;
    } else if (area === StarArea.GALAXY) {
      this.zoomLevel = 0.45;
    }
    this.panX = 0;
    this.panY = 0;
    this.emitZoomChanged();
    
    // Auto-fit content to screen after a short delay to let positions settle
    requestAnimationFrame(() => this.fitContent());
  }

  /**
   * Auto-calculate zoom and pan to fit all visible stars within the canvas.
   * This ensures the star map looks good on any screen size (especially portrait mobile).
   * @param padding Fraction of canvas to use (0.0-1.0), default 0.80
   */
  public fitContent(padding: number = 0.80): void {
    const activeStars = this.renderStars.filter(rs => this.isStarInActiveArea(rs.star));
    if (activeStars.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const rs of activeStars) {
      if (rs.x < minX) minX = rs.x;
      if (rs.x > maxX) maxX = rs.x;
      if (rs.y < minY) minY = rs.y;
      if (rs.y > maxY) maxY = rs.y;
    }

    const contentWidth = maxX - minX || 1;
    const contentHeight = maxY - minY || 1;
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;

    const scaleX = (this.width * padding) / contentWidth;
    const scaleY = (this.height * padding) / contentHeight;
    const newZoom = Math.min(scaleX, scaleY);

    // Clamp zoom within allowed range
    const clamped = Math.min(3.0, Math.max(0.3, newZoom));

    // Center the content on screen
    this.panX = (this.width / 2 - contentCenterX) * clamped;
    this.panY = (this.height / 2 - contentCenterY) * clamped;
    this.zoomLevel = clamped;
    this.emitZoomChanged();
  }

  public isStarInActiveArea(star: Star): boolean {
    const area = this.activeArea;
    const idx = star.index;
    if (area === StarArea.SOLARSYSTEM) return idx <= 10;
    if (area === StarArea.LIGHTYEAR_50) return idx > 10 && idx <= 100;
    if (area === StarArea.LIGHTYEAR_1W) return idx > 100 && idx <= 200;
    if (area === StarArea.GALAXY) return idx > 200 && idx <= 1000;
    return false;
  }

  // ==================== Resize ====================

  private resize() {
    const container = this.canvas.parentElement;
    if (container) {
      this.width = container.clientWidth;
      this.height = container.clientHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  public initStars(stars: Star[]) {
    this.renderStars = [];
    const cx = this.width / 2;
    const cy = this.height / 2;

    const orbitScales: Record<number, number> = {
      0: 0,      // 太阳
      1: 0.39,   // 水星
      2: 0.72,   // 金星
      3: 1.0,    // 地球
      4: 0.08,   // 月球
      5: 1.52,   // 火星
      6: 5.2,    // 木星
      7: 9.5,    // 土星
      8: 19.2,   // 天王星
      9: 30.1,   // 海王星
      10: 39.5,  // 冥王星
    };

    const sizeMap: Record<number, number> = {
      0: 30, 1: 3, 2: 5, 3: 6, 4: 2, 5: 4,
      6: 14, 7: 12, 8: 9, 9: 9, 10: 2,
    };

    const baseOrbitRadius = 80;

    stars.forEach(s => {
      let orbitRadius = 0;
      let radius = 6;
      const angle = Math.random() * Math.PI * 2;
      let speed = 0;
      let parentIndex: number | undefined = undefined;
      let offsetX: number | undefined = undefined;
      let offsetY: number | undefined = undefined;

      if (s.index <= 10) {
        radius = sizeMap[s.index] || 4;
        if (s.index === 0) {
          orbitRadius = 0;
          speed = 0;
        } else if (s.index === 4) {
          orbitRadius = 20;
          speed = 0.015;
          parentIndex = 3;
        } else {
          const scale = orbitScales[s.index] || 1;
          orbitRadius = Math.log(scale + 1) * baseOrbitRadius + 50;
          speed = 0.005 * Math.pow(scale, -1.5);
          if (speed < 0.0005) speed = 0.0005;
        }
      } else {
        radius = 4 + (s.index % 3);
        speed = 0;
        if (s.index <= 100) {
          const offsetIndex = s.index - 10;
          const r = Math.sqrt(offsetIndex) * 75 + 40;
          const a = offsetIndex * 2.39996;
          offsetX = Math.cos(a) * r * 1.5;
          offsetY = Math.sin(a) * r * 1.2;
        } else if (s.index <= 200) {
          const offsetIndex = s.index - 100;
          const r = Math.sqrt(offsetIndex) * 90 + 50;
          const a = offsetIndex * 2.39996 + 1.2;
          offsetX = Math.cos(a) * r * 1.6;
          offsetY = Math.sin(a) * r * 1.3;
        } else {
          const offsetIndex = s.index - 200;
          const arm = offsetIndex % 2 === 0 ? 0 : Math.PI;
          const theta = Math.sqrt(offsetIndex) * 0.45;
          const r = Math.sqrt(offsetIndex) * 22 + 20;
          const jitterSeed = offsetIndex * 997;
          const jitterX = ((jitterSeed % 50) - 25) * 1.2;
          const jitterY = (((jitterSeed >> 3) % 40) - 20) * 1.2;
          offsetX = Math.cos(theta + arm) * r * 1.8 + jitterX;
          offsetY = Math.sin(theta + arm) * r * 1.3 + jitterY;
        }
      }

      const renderStar = {
        star: s,
        x: cx + (offsetX || 0),
        y: cy + (offsetY || 0),
        radius,
        orbitRadius,
        angle,
        speed,
        parentIndex,
        offsetX,
        offsetY
      };

      this.renderStars.push(renderStar);
      this.renderStarMap.set(s.index, renderStar);
    });
  }

  // ==================== Mouse Events (Desktop) ====================

  private initMouseEvents() {
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      
      this.hoveredStar = null;
      for (const rs of this.renderStars) {
        if (!this.isStarInActiveArea(rs.star)) continue;
        const screenX = (rs.x - this.width / 2) * this.zoomLevel + this.width / 2 + this.panX;
        const screenY = (rs.y - this.height / 2) * this.zoomLevel + this.height / 2 + this.panY;
        const dx = screenX - rawX;
        const dy = screenY - rawY;
        const visualRadius = rs.radius * this.zoomLevel;
        if (dx * dx + dy * dy <= visualRadius * visualRadius * 4 + 100) {
          this.hoveredStar = rs;
          break;
        }
      }
      this.canvas.style.cursor = this.hoveredStar ? "pointer" : "default";
    });

    this.canvas.addEventListener("click", () => {
      if (this.hoveredStar) {
        this.selectedStar = this.hoveredStar;
        if (this.onStarClick) {
          this.onStarClick(this.selectedStar.star);
        }
        window.dispatchEvent(new CustomEvent('star-selected', { detail: this.selectedStar.star }));
      } else {
        this.selectedStar = null;
      }
    });

    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (e.deltaY < 0) this.zoomIn();
      else this.zoomOut();
    });
  }

  // ==================== Touch Events (Mobile) ====================

  private initTouchEvents() {
    const canvas = this.canvas;

    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touches = e.touches;

      if (touches.length === 1) {
        // Single finger: prepare for pan or tap
        const t = touches[0];
        const rect = canvas.getBoundingClientRect();
        this.touch.active = true;
        this.touch.startX = t.clientX - rect.left;
        this.touch.startY = t.clientY - rect.top;
        this.touch.lastX = this.touch.startX;
        this.touch.lastY = this.touch.startY;
        this.touch.moved = false;
        this.touch.startTime = Date.now();
      } else if (touches.length === 2) {
        // Two fingers: prepare for pinch zoom
        const t1 = touches[0];
        const t2 = touches[1];
        this.touch.active = true;
        this.touch.startDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        this.touch.startZoom = this.zoomLevel;
        this.touch.moved = false;
      }
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touches = e.touches;

      if (touches.length === 1 && this.touch.active) {
        // Single finger drag → pan
        const t = touches[0];
        const rect = canvas.getBoundingClientRect();
        const currentX = t.clientX - rect.left;
        const currentY = t.clientY - rect.top;

        const dx = currentX - this.touch.lastX;
        const dy = currentY - this.touch.lastY;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          this.touch.moved = true;
        }

        this.panX += dx;
        this.panY += dy;

        this.touch.lastX = currentX;
        this.touch.lastY = currentY;
      } else if (touches.length === 2 && this.touch.active) {
        // Two finger pinch → zoom
        const t1 = touches[0];
        const t2 = touches[1];
        const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

        if (this.touch.startDistance > 0) {
          const scale = currentDistance / this.touch.startDistance;
          const newZoom = Math.min(3.0, Math.max(0.3, this.touch.startZoom * scale));
          if (Math.abs(newZoom - this.zoomLevel) > 0.01) {
            this.zoomLevel = newZoom;
            this.emitZoomChanged();
          }
        }

        this.touch.moved = true;
      }
    }, { passive: false });

    canvas.addEventListener("touchend", (e) => {
      const remainingTouches = e.touches.length;

      if (remainingTouches === 0) {
        // All fingers lifted
        if (!this.touch.moved && Date.now() - this.touch.startTime < 300) {
          // It was a tap (not a drag) → treat as click
          this.handleTouchTap(this.touch.startX, this.touch.startY);
        }
        this.touch.active = false;
      } else if (remainingTouches === 1) {
        // One finger remaining, transition to single-finger mode
        const t = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        this.touch.startX = t.clientX - rect.left;
        this.touch.startY = t.clientY - rect.top;
        this.touch.lastX = this.touch.startX;
        this.touch.lastY = this.touch.startY;
      }
    }, { passive: false });

    canvas.addEventListener("touchcancel", () => {
      this.touch.active = false;
    }, { passive: false });
  }

  /** Handle a tap on touch devices: find nearest star and select it */
  private handleTouchTap(tapX: number, tapY: number): void {
    // Similar hit test as mousemove
    let tappedStar: RenderStar | null = null;
    for (const rs of this.renderStars) {
      if (!this.isStarInActiveArea(rs.star)) continue;
      const screenX = (rs.x - this.width / 2) * this.zoomLevel + this.width / 2 + this.panX;
      const screenY = (rs.y - this.height / 2) * this.zoomLevel + this.height / 2 + this.panY;
      const dx = screenX - tapX;
      const dy = screenY - tapY;
      const visualRadius = rs.radius * this.zoomLevel;

      // Larger hit area for touch (fingers are less precise)
      const hitRadius = Math.max(visualRadius * 4 + 100, 44); // 44px minimum tap target
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        tappedStar = rs;
        break;
      }
    }

    if (tappedStar) {
      this.selectedStar = tappedStar;
      this.hoveredStar = tappedStar;
      if (this.onStarClick) {
        this.onStarClick(tappedStar.star);
      }
      window.dispatchEvent(new CustomEvent('star-selected', { detail: tappedStar.star }));
    } else {
      this.selectedStar = null;
      this.hoveredStar = null;
    }
  }

  // ==================== Lifecycle ====================

  public start() {
    const loop = () => {
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }

  public stop() {
    cancelAnimationFrame(this.animationId);
    this.cleanupResizeObserver();
  }

  // ==================== Render Loop ====================

  private update() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    
    for (const rs of this.renderStars) {
      if (rs.star.index <= 10) {
        if (rs.orbitRadius > 0) {
          rs.angle += rs.speed;
          let baseX = cx;
          let baseY = cy;
          if (rs.parentIndex !== undefined) {
            const parent = this.renderStars.find(s => s.star.index === rs.parentIndex);
            if (parent) {
              baseX = parent.x;
              baseY = parent.y;
            }
          }
          rs.x = baseX + Math.cos(rs.angle) * rs.orbitRadius;
          rs.y = baseY + Math.sin(rs.angle) * rs.orbitRadius * 0.8;
        } else {
          rs.x = cx;
          rs.y = cy;
        }
      } else {
        if (rs.offsetX !== undefined && rs.offsetY !== undefined) {
          rs.x = cx + rs.offsetX;
          rs.y = cy + rs.offsetY;
        }
      }
    }
  }

  private draw() {
    this.ctx.fillStyle = "rgba(7, 11, 20, 0.35)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Distant galaxy dust
    for (const g of this.distantGalaxies) {
      this.ctx.beginPath();
      this.ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 184, 255, ${g.alpha * 0.4})`;
      this.ctx.fill();
    }

    this.ctx.save();
    this.ctx.translate(this.width / 2 + this.panX, this.height / 2 + this.panY);
    this.ctx.scale(this.zoomLevel, this.zoomLevel);
    this.ctx.translate(-this.width / 2, -this.height / 2);

    const primaryColor = getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || "#00B8FF";
    const primaryColorRgb = getComputedStyle(document.body).getPropertyValue('--color-primary-rgb').trim() || "0, 184, 255";

    const cx = this.width / 2;
    const cy = this.height / 2;

    // 1. Grid
    if (this.activeArea !== StarArea.SOLARSYSTEM) {
      this.ctx.strokeStyle = `rgba(${primaryColorRgb}, 0.03)`;
      this.ctx.lineWidth = 1;
      const gridSpacing = 150;
      for (let x = cx - 3000; x <= cx + 3000; x += gridSpacing) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, cy - 3000);
        this.ctx.lineTo(x, cy + 3000);
        this.ctx.stroke();
        if (Math.abs(x - cx) % 300 === 0 && Math.abs(x - cx) < 2000) {
          this.ctx.fillStyle = `rgba(${primaryColorRgb}, 0.15)`;
          this.ctx.font = "8px JetBrains Mono, monospace";
          this.ctx.fillText(`SEC-${Math.round((x - cx)/10)}`, x + 5, cy + 12);
        }
      }
      for (let y = cy - 3000; y <= cy + 3000; y += gridSpacing) {
        this.ctx.beginPath();
        this.ctx.moveTo(cx - 3000, y);
        this.ctx.lineTo(cx + 3000, y);
        this.ctx.stroke();
        if (Math.abs(y - cy) % 300 === 0 && Math.abs(y - cy) < 2000) {
          this.ctx.fillStyle = `rgba(${primaryColorRgb}, 0.15)`;
          this.ctx.font = "8px JetBrains Mono, monospace";
          this.ctx.fillText(`LY-${Math.round((cy - y)/10)}`, cx + 5, y - 5);
        }
      }
    }

    // 2. Constellation lines
    if (this.activeArea === StarArea.LIGHTYEAR_50 || this.activeArea === StarArea.LIGHTYEAR_1W) {
      const activeStars = this.renderStars.filter(rs => this.isStarInActiveArea(rs.star));
      this.ctx.strokeStyle = `rgba(${primaryColorRgb}, 0.05)`;
      this.ctx.lineWidth = 1;
      for (let i = 0; i < activeStars.length; i++) {
        for (let j = i + 1; j < activeStars.length; j++) {
          const s1 = activeStars[i];
          const s2 = activeStars[j];
          const dx = s1.x - s2.x;
          const dy = s1.y - s2.y;
          if (dx * dx + dy * dy < 180 * 180) {
            this.ctx.beginPath();
            this.ctx.moveTo(s1.x, s1.y);
            this.ctx.lineTo(s2.x, s2.y);
            this.ctx.stroke();
          }
        }
      }
    }

    // 3. Orbits
    if (this.activeArea === StarArea.SOLARSYSTEM) {
      for (const rs of this.renderStars) {
        if (rs.orbitRadius > 0 && this.isStarInActiveArea(rs.star)) {
          this.ctx.beginPath();
          this.ctx.ellipse(this.width / 2, this.height / 2, rs.orbitRadius, rs.orbitRadius * 0.8, 0, 0, Math.PI * 2);
          this.ctx.strokeStyle = `rgba(${primaryColorRgb}, 0.05)`;
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([4, 6]);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
        }
      }
    }

    // 4. Stars
    for (const rs of this.renderStars) {
      if (!this.isStarInActiveArea(rs.star)) continue;
      
      const { star, x, y, radius } = rs;
      
      let color = "#556080";
      let glowColor = `rgba(${primaryColorRgb}, 0.15)`;
      
      if (star.index === 0) {
        color = "#FFD54F";
        glowColor = "rgba(255, 213, 79, 0.4)";
      } else if (star.belongToCivi === "地球") {
        color = primaryColor;
        glowColor = `rgba(${primaryColorRgb}, 0.5)`;
      } else if (star.belongToCivi && star.belongToCivi !== "地球") {
        color = "#FF5252";
        glowColor = "rgba(255, 82, 82, 0.4)";
      } else if (star.found) {
        color = `rgba(${primaryColorRgb}, 0.6)`;
      }

      // Core dot
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();

      // Radar ring
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
      this.ctx.strokeStyle = glowColor;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Territory pulse
      if (star.belongToCivi) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 4]);
        const pulseRadius = radius + 9 + Math.sin(Date.now() * 0.003) * 1.5;
        this.ctx.beginPath();
        this.ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();

        this.ctx.fillStyle = star.belongToCivi === "地球" ? "rgba(0, 184, 255, 0.5)" : "rgba(255, 82, 82, 0.5)";
        this.ctx.font = "8px JetBrains Mono, monospace";
        this.ctx.fillText(`[${star.belongToCivi}]`, x - 15, y + radius + 11);
      }

      // Name tag
      if (star.belongToCivi) {
        let symbolChar = "○";
        if (star.hasCity || star.currentPopulation >= 500) symbolChar = "◇";
        else if (star.hasFactory || star.hasStope) symbolChar = "△";
        this.ctx.fillStyle = color;
        this.ctx.font = "bold 10px Inter, sans-serif";
        this.ctx.fillText(`${symbolChar} ${star.name}`, x - 18, y - radius - 7);
      } else {
        this.ctx.fillStyle = "rgba(221, 238, 255, 0.45)";
        this.ctx.font = "9px Inter, sans-serif";
        this.ctx.fillText(star.name, x - 15, y - radius - 5);
      }

      // Event-driven status indicators (rebellion / building)
      if (star.status === 'rebellion') {
        this.ctx.font = "bold 10px Inter, sans-serif";
        this.ctx.fillStyle = "#FF5252";
        this.ctx.fillText("⚠ 叛乱", x + radius + 6, y - radius - 22);
      } else if (star.status === 'building') {
        this.ctx.font = "bold 10px Inter, sans-serif";
        this.ctx.fillStyle = "#66BB6A";
        this.ctx.fillText("🔨 建设", x + radius + 6, y - radius - 22);
      }

      // Anomaly & Ruin markers
      if (star.index > 10 && !star.belongToCivi) {
        this.ctx.font = "9px Inter, sans-serif";
        if (star.index === 13 || star.index === 17 || star.index === 23) {
          this.ctx.fillStyle = "#FFB300";
          this.ctx.fillText("⚠ 异常", x - 14, y - radius - 15);
        } else if (star.index === 15 || star.index === 21 || star.index === 28) {
          this.ctx.fillStyle = "#66BB6A";
          this.ctx.fillText("⬢ 遗迹", x - 14, y - radius - 15);
        }
      }

      // Selection bracket
      if (this.selectedStar === rs || this.hoveredStar === rs) {
        const size = radius + 6;
        this.ctx.strokeStyle = this.selectedStar === rs ? primaryColor : "rgba(221, 238, 255, 0.4)";
        this.ctx.lineWidth = 1;

        const drawCorner = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
          this.ctx.beginPath();
          this.ctx.moveTo(x1, y1);
          this.ctx.lineTo(x2, y2);
          this.ctx.lineTo(x3, y3);
          this.ctx.stroke();
        };

        drawCorner(x - size, y - size + 3, x - size, y - size, x - size + 3, y - size);
        drawCorner(x + size, y - size + 3, x + size, y - size, x + size - 3, y - size);
        drawCorner(x - size, y + size - 3, x - size, y + size, x - size + 3, y + size);
        drawCorner(x + size, y + size - 3, x + size, y + size, x + size - 3, y + size);

        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.font = "bold 10px JetBrains Mono, monospace";
        this.ctx.fillText(`ID: ${star.name.toUpperCase()}`, x + size + 6, y - 2);
        this.ctx.fillStyle = "rgba(221, 238, 255, 0.7)";
        this.ctx.font = "9px Inter, sans-serif";
        this.ctx.fillText(star.belongToCivi ? `CIV: ${star.belongToCivi}` : "SECTOR: UNMAPPED", x + size + 6, y + 8);
      }
    }

    // 5. Fleets
    const game = GameInstance.get();
    const allFleets: any[] = [];
    if (game.earthCivi && game.earthCivi.fleets) {
      game.earthCivi.fleets.forEach(f => allFleets.push(f));
    }
    if (game.alienCiviManager && game.alienCiviManager.aliens) {
      for (const alien of game.alienCiviManager.aliens.values()) {
        if (alien.fleets) alien.fleets.forEach((f: any) => allFleets.push(f));
      }
    }

    allFleets.forEach(fleet => {
      if (fleet.eta > 0) {
        const srcStar = this.renderStarMap.get(fleet.sourceStarIndex);
        const dstStar = this.renderStarMap.get(fleet.targetStarIndex);
        if (srcStar && dstStar) {
          if (!this.isStarInActiveArea(srcStar.star) || !this.isStarInActiveArea(dstStar.star)) return;
          const isEarth = fleet.belongToCivi === "地球";
          this.ctx.beginPath();
          this.ctx.moveTo(srcStar.x, srcStar.y);
          this.ctx.lineTo(dstStar.x, dstStar.y);
          this.ctx.strokeStyle = isEarth ? `rgba(${primaryColorRgb}, 0.25)` : "rgba(255, 82, 82, 0.25)";
          this.ctx.setLineDash([3, 4]);
          this.ctx.stroke();
          this.ctx.setLineDash([]);

          const total = fleet.totalEta > 0 ? fleet.totalEta : 1;
          const progress = 1 - (fleet.eta / total);
          const fx = srcStar.x + (dstStar.x - srcStar.x) * progress;
          const fy = srcStar.y + (dstStar.y - srcStar.y) * progress;

          this.ctx.save();
          this.ctx.translate(fx, fy);
          const angle = Math.atan2(dstStar.y - srcStar.y, dstStar.x - srcStar.x);
          this.ctx.rotate(angle);
          this.ctx.beginPath();
          this.ctx.moveTo(6, 0);
          this.ctx.lineTo(-4, -4);
          this.ctx.lineTo(-4, 4);
          this.ctx.closePath();
          this.ctx.fillStyle = isEarth ? primaryColor : "#FF5252";
          this.ctx.fill();
          this.ctx.restore();

          this.ctx.fillStyle = isEarth ? primaryColor : "#FF5252";
          this.ctx.font = "bold 9px JetBrains Mono, monospace";
          this.ctx.fillText(`${fleet.name.toUpperCase()} [ETA: ${fleet.eta}T]`, fx + 8, fy + 3);
        }
      }
    });

    this.ctx.restore();
  }

  public getStarScreenCoords(starIndex: number): { x: number; y: number } | null {
    const rs = this.renderStarMap.get(starIndex);
    if (!rs || !this.isStarInActiveArea(rs.star)) return null;
    const rect = this.canvas.getBoundingClientRect();
    const screenX = (rs.x - this.width / 2) * this.zoomLevel + this.width / 2 + this.panX + rect.left;
    const screenY = (rs.y - this.height / 2) * this.zoomLevel + this.height / 2 + this.panY + rect.top;
    return { x: screenX, y: screenY };
  }
}