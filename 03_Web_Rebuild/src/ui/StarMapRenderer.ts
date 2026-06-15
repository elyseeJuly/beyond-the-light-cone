import { Star } from "../core/Star";
import { GameInstance } from "../core/Game";
import { StarArea } from "../types/enums";

interface RenderStar {
  star: Star;
  x: number;
  y: number;
  radius: number;
  orbitRadius: number; // 围绕中心（或母星）的轨道半径
  angle: number;       // 当前轨道角度
  speed: number;       // 轨道运动速度
  parentIndex?: number; // 母星Index（如果是卫星）
  offsetX?: number;
  offsetY?: number;
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

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    
    this.resize();
    this.generateDistantGalaxies();
    window.addEventListener("resize", () => { this.resize(); this.generateDistantGalaxies(); });
    
    this.initMouseEvents();
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

  public zoomIn(): void { this.zoomLevel = Math.min(3.0, this.zoomLevel + 0.2); }
  public zoomOut(): void { this.zoomLevel = Math.max(0.3, this.zoomLevel - 0.2); }
  public resetView(): void { this.zoomLevel = 1.0; this.panX = 0; this.panY = 0; }

  public setActiveArea(area: StarArea): void {
    this.activeArea = area;
    this.hoveredStar = null;
    this.selectedStar = null;
    
    // Auto scale and center
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
      4: 0.08,   // 月球（相对于地球的轨道半径，视觉缩放）
      5: 1.52,   // 火星
      6: 5.2,    // 木星
      7: 9.5,    // 土星
      8: 19.2,   // 天王星
      9: 30.1,   // 海王星
      10: 39.5,  // 冥王星
    };

    // 基于真实体积的非线性对数缩放
    const sizeMap: Record<number, number> = {
      0: 30, // 太阳
      1: 3,  // 水星
      2: 5,  // 金星
      3: 6,  // 地球
      4: 2,  // 月球
      5: 4,  // 火星
      6: 14, // 木星
      7: 12, // 土星
      8: 9,  // 天王星
      9: 9,  // 海王星
      10: 2, // 冥王星
    };

    const baseOrbitRadius = 80;

    stars.forEach(s => {
      let orbitRadius = 0;
      let radius = 6;
      let angle = Math.random() * Math.PI * 2;
      let speed = 0;
      let parentIndex: number | undefined = undefined;
      let offsetX: number | undefined = undefined;
      let offsetY: number | undefined = undefined;

      if (s.index <= 10) { // Solar System
        radius = sizeMap[s.index] || 4;
        
        if (s.index === 0) { // 太阳
          orbitRadius = 0;
          speed = 0;
        } else if (s.index === 4) { // 月球，绕地球
          orbitRadius = 20; // 固定视觉距离
          speed = 0.015; // 月球转速相对地球稍快
          parentIndex = 3;
        } else {
          // 行星轨道，采用指数级间隔防止挤在一起
          const scale = orbitScales[s.index] || 1;
          // 使用非线性对数轨道半径，使得内圈可见，外圈不过于遥远
          orbitRadius = Math.log(scale + 1) * baseOrbitRadius + 50;
          
          // 开普勒第三定律近似: v ∝ r^(-1.5)
          speed = 0.005 * Math.pow(scale, -1.5);
          // 限制最小速度
          if (speed < 0.0005) speed = 0.0005;
        }
      } else { // Extra-solar based on Distance and index ranges
        radius = 4 + (s.index % 3);
        speed = 0;
        
        if (s.index <= 100) { // 50 Light Years
          const offsetIndex = s.index - 10;
          const r = Math.sqrt(offsetIndex) * 75 + 40;
          const angle = offsetIndex * 2.39996; // Golden angle
          offsetX = Math.cos(angle) * r * 1.5;
          offsetY = Math.sin(angle) * r * 1.2;
        } else if (s.index <= 200) { // 10k Light Years
          const offsetIndex = s.index - 100;
          const r = Math.sqrt(offsetIndex) * 90 + 50;
          const angle = offsetIndex * 2.39996 + 1.2;
          offsetX = Math.cos(angle) * r * 1.6;
          offsetY = Math.sin(angle) * r * 1.3;
        } else { // Galaxy
          const offsetIndex = s.index - 200;
          const arm = offsetIndex % 2 === 0 ? 0 : Math.PI; // 2 arms
          const theta = Math.sqrt(offsetIndex) * 0.45; // spiral angle sweep
          const r = Math.sqrt(offsetIndex) * 22 + 20; // spiral radius
          
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

  private initMouseEvents() {
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      
      this.hoveredStar = null;
      for (const rs of this.renderStars) {
        if (!this.isStarInActiveArea(rs.star)) continue;

        // 逆向坐标变换，将世界坐标转换为屏幕坐标
        const screenX = (rs.x - this.width / 2) * this.zoomLevel + this.width / 2 + this.panX;
        const screenY = (rs.y - this.height / 2) * this.zoomLevel + this.height / 2 + this.panY;

        const dx = screenX - rawX;
        const dy = screenY - rawY;
        const visualRadius = rs.radius * this.zoomLevel;

        if (dx * dx + dy * dy <= visualRadius * visualRadius * 4 + 100) { // 增加容错判定
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
  }

  private update() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    
    for (const rs of this.renderStars) {
      if (rs.star.index <= 10) { // Solar System (dynamic orbiters)
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
          rs.y = baseY + Math.sin(rs.angle) * rs.orbitRadius * 0.8; // 微微的椭圆视角
        } else {
          rs.x = cx;
          rs.y = cy;
        }
      } else { // Extra-solar stars (static offsets)
        if (rs.offsetX !== undefined && rs.offsetY !== undefined) {
          rs.x = cx + rs.offsetX;
          rs.y = cy + rs.offsetY;
        }
      }
    }
  }

  private draw() {
    // Holographic deep space background with trail effect
    this.ctx.fillStyle = "rgba(7, 11, 20, 0.35)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw distant galaxy dust
    for (const g of this.distantGalaxies) {
      this.ctx.beginPath();
      this.ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 184, 255, ${g.alpha * 0.4})`; // Soft blue star dust
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

    // 1. Draw crosshair tactical grids in extra-solar modes (Background Layer)
    if (this.activeArea !== StarArea.SOLARSYSTEM) {
      this.ctx.strokeStyle = `rgba(${primaryColorRgb}, 0.03)`;
      this.ctx.lineWidth = 1;
      const gridSpacing = 150;
      
      // Draw vertical grid lines
      for (let x = cx - 3000; x <= cx + 3000; x += gridSpacing) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, cy - 3000);
        this.ctx.lineTo(x, cy + 3000);
        this.ctx.stroke();
        
        // draw tick label
        if (Math.abs(x - cx) % 300 === 0 && Math.abs(x - cx) < 2000) {
          this.ctx.fillStyle = `rgba(${primaryColorRgb}, 0.15)`;
          this.ctx.font = "8px JetBrains Mono, monospace";
          this.ctx.fillText(`SEC-${Math.round((x - cx)/10)}`, x + 5, cy + 12);
        }
      }
      
      // Draw horizontal grid lines
      for (let y = cy - 3000; y <= cy + 3000; y += gridSpacing) {
        this.ctx.beginPath();
        this.ctx.moveTo(cx - 3000, y);
        this.ctx.lineTo(cx + 3000, y);
        this.ctx.stroke();
        
        // draw tick label
        if (Math.abs(y - cy) % 300 === 0 && Math.abs(y - cy) < 2000) {
          this.ctx.fillStyle = `rgba(${primaryColorRgb}, 0.15)`;
          this.ctx.font = "8px JetBrains Mono, monospace";
          this.ctx.fillText(`LY-${Math.round((cy - y)/10)}`, cx + 5, y - 5);
        }
      }
    }

    // 2. Draw Constellation grid lines in 50LY & 10kLY modes (Background Layer)
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
          const distSq = dx * dx + dy * dy;
          // Connect if distance < 180px
          if (distSq < 180 * 180) {
            this.ctx.beginPath();
            this.ctx.moveTo(s1.x, s1.y);
            this.ctx.lineTo(s2.x, s2.y);
            this.ctx.stroke();
          }
        }
      }
    }

    // 3. Draw Orbits first (Background Layer) - only for Solar System
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

    // 4. Draw Stars (Middle Layer)
    for (const rs of this.renderStars) {
      if (!this.isStarInActiveArea(rs.star)) continue;
      
      const { star, x, y, radius } = rs;
      
      let color = "#556080"; 
      let glowColor = `rgba(${primaryColorRgb}, 0.15)`;
      
      // Determine star/planet role colors and glow colors
      if (star.index === 0) { // Sun
        color = "#FFD54F"; // Golden
        glowColor = "rgba(255, 213, 79, 0.4)";
      } else if (star.belongToCivi === "地球") {
        color = primaryColor;
        glowColor = `rgba(${primaryColorRgb}, 0.5)`;
      } else if (star.belongToCivi && star.belongToCivi !== "地球") {
        color = "#FF5252"; // Crisis Red for alien threats
        glowColor = "rgba(255, 82, 82, 0.4)";
      } else if (star.found) {
        color = `rgba(${primaryColorRgb}, 0.6)`;
      }

      // Draw vector core dot
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();

      // Draw thin outer radar ring
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
      this.ctx.strokeStyle = glowColor;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Pulsing territory boundaries & faction tags
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

        // Faction tag below star
        this.ctx.fillStyle = star.belongToCivi === "地球" ? "rgba(0, 184, 255, 0.5)" : "rgba(255, 82, 82, 0.5)";
        this.ctx.font = "8px JetBrains Mono, monospace";
        this.ctx.fillText(`[${star.belongToCivi}]`, x - 15, y + radius + 11);
      }

      // Dynamic Colony symbols & Name tag
      if (star.belongToCivi) {
        let symbolChar = "○"; // Outpost default
        if (star.hasCity || star.currentPopulation >= 500) {
          symbolChar = "◇"; // Metropolis
        } else if (star.hasFactory || star.hasStope) {
          symbolChar = "△"; // Industrial
        }
        
        this.ctx.fillStyle = color;
        this.ctx.font = "bold 10px Inter, sans-serif";
        this.ctx.fillText(`${symbolChar} ${star.name}`, x - 18, y - radius - 7);
      } else {
        // Draw unowned star name
        this.ctx.fillStyle = "rgba(221, 238, 255, 0.45)";
        this.ctx.font = "9px Inter, sans-serif";
        this.ctx.fillText(star.name, x - 15, y - radius - 5);
      }

      // Draw Anomaly (⚠) and Ruins (⬢) on extra-solar points when uncolonized
      if (star.index > 10 && !star.belongToCivi) {
        this.ctx.font = "9px Inter, sans-serif";
        if (star.index === 13 || star.index === 17 || star.index === 23) { // Mock Anomaly
          this.ctx.fillStyle = "#FFB300"; // Warning Orange
          this.ctx.fillText("⚠ 异常", x - 14, y - radius - 15);
        } else if (star.index === 15 || star.index === 21 || star.index === 28) { // Mock Ruin
          this.ctx.fillStyle = "#66BB6A"; // Success Green for ruins
          this.ctx.fillText("⬢ 遗迹", x - 14, y - radius - 15);
        }
      }

      // Target bracket selection box if hovered or selected
      if (this.selectedStar === rs || this.hoveredStar === rs) {
        const size = radius + 6;
        this.ctx.strokeStyle = this.selectedStar === rs ? primaryColor : "rgba(221, 238, 255, 0.4)";
        this.ctx.lineWidth = 1;
        
        // Draw corners []
        // Top-Left
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y - size + 3);
        this.ctx.lineTo(x - size, y - size);
        this.ctx.lineTo(x - size + 3, y - size);
        this.ctx.stroke();

        // Top-Right
        this.ctx.beginPath();
        this.ctx.moveTo(x + size, y - size + 3);
        this.ctx.lineTo(x + size, y - size);
        this.ctx.lineTo(x + size - 3, y - size);
        this.ctx.stroke();

        // Bottom-Left
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y + size - 3);
        this.ctx.lineTo(x - size, y + size);
        this.ctx.lineTo(x - size + 3, y + size);
        this.ctx.stroke();

        // Bottom-Right
        this.ctx.beginPath();
        this.ctx.moveTo(x + size, y + size - 3);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.lineTo(x + size - 3, y + size);
        this.ctx.stroke();

        // Render tactical text tag
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.font = "bold 10px JetBrains Mono, monospace";
        this.ctx.fillText(`ID: ${star.name.toUpperCase()}`, x + size + 6, y - 2);
        
        this.ctx.fillStyle = "rgba(221, 238, 255, 0.7)";
        this.ctx.font = "9px Inter, sans-serif";
        this.ctx.fillText(star.belongToCivi ? `CIV: ${star.belongToCivi}` : "SECTOR: UNMAPPED", x + size + 6, y + 8);
      }
    }

    // 5. Draw Active Fleets (Foreground Layer)
    const game = GameInstance.get();
    const allFleets: any[] = [];
    if (game.earthCivi && game.earthCivi.fleets) {
      game.earthCivi.fleets.forEach(f => allFleets.push(f));
    }
    if (game.alienCiviManager && game.alienCiviManager.aliens) {
      for (const alien of game.alienCiviManager.aliens.values()) {
        if (alien.fleets) {
          alien.fleets.forEach((f: any) => allFleets.push(f));
        }
      }
    }

    allFleets.forEach(fleet => {
      if (fleet.eta > 0) {
        const srcStar = this.renderStarMap.get(fleet.sourceStarIndex);
        const dstStar = this.renderStarMap.get(fleet.targetStarIndex);

        if (srcStar && dstStar) {
          // Filter fleets by activeArea
          if (!this.isStarInActiveArea(srcStar.star) || !this.isStarInActiveArea(dstStar.star)) {
            return;
          }

          const isEarth = fleet.belongToCivi === "地球";
          
          // Vector navigation route line
          this.ctx.beginPath();
          this.ctx.moveTo(srcStar.x, srcStar.y);
          this.ctx.lineTo(dstStar.x, dstStar.y);
          this.ctx.strokeStyle = isEarth 
            ? `rgba(${primaryColorRgb}, 0.25)`
            : "rgba(255, 82, 82, 0.25)";
          this.ctx.setLineDash([3, 4]);
          this.ctx.stroke();
          this.ctx.setLineDash([]);

          // Fleet position interpolation
          const total = fleet.totalEta > 0 ? fleet.totalEta : 1;
          const progress = 1 - (fleet.eta / total);
          const fx = srcStar.x + (dstStar.x - srcStar.x) * progress;
          const fy = srcStar.y + (dstStar.y - srcStar.y) * progress;

          // Draw outlined triangle ▲ representing fleet vector
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

          // Tactical fleet tag in JetBrains Mono
          this.ctx.fillStyle = isEarth ? primaryColor : "#FF5252";
          this.ctx.font = "bold 9px JetBrains Mono, monospace";
          this.ctx.fillText(`${fleet.name.toUpperCase()} [ETA: ${fleet.eta}T]`, fx + 8, fy + 3);
        }
      }
    });

    this.ctx.restore();
  }
}
