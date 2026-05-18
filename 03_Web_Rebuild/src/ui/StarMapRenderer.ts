import { Star } from "../core/Star";
import { GameInstance } from "../core/Game";

interface RenderStar {
  star: Star;
  x: number;
  y: number;
  radius: number;
  orbitRadius: number; // 围绕中心（或母星）的轨道半径
  angle: number;       // 当前轨道角度
  speed: number;       // 轨道运动速度
  parentIndex?: number; // 母星Index（如果是卫星）
}

export class StarMapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private renderStars: RenderStar[] = [];
  private animationId: number = 0;
  
  private hoveredStar: RenderStar | null = null;
  private selectedStar: RenderStar | null = null;

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
      } else if (s.index <= 100) { // 50 light-years
        orbitRadius = 500 + Math.random() * 500;
        radius = 4 + Math.random() * 4;
        speed = 0.0005;
      } else if (s.index <= 200) { // 10000 light-years
        orbitRadius = 1500 + Math.random() * 1000;
        radius = 3 + Math.random() * 3;
        speed = 0.0001;
      } else { // Galaxy
        orbitRadius = 3000 + Math.random() * 2000;
        radius = 2 + Math.random() * 2;
        speed = 0.00005;
      }

      this.renderStars.push({
        star: s,
        x: cx,
        y: cy,
        radius,
        orbitRadius,
        angle,
        speed,
        parentIndex
      });
    });
  }

  private initMouseEvents() {
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      
      this.hoveredStar = null;
      for (const rs of this.renderStars) {
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
    }
  }

  private draw() {
    const bg = getComputedStyle(document.body).getPropertyValue('--bg-space-dark').trim() || "#02040a";
    let trailColor = "rgba(5, 5, 10, 0.3)";
    if (bg.startsWith('#')) {
      const r = parseInt(bg.slice(1, 3), 16);
      const g = parseInt(bg.slice(3, 5), 16);
      const b = parseInt(bg.slice(5, 7), 16);
      trailColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
    } else if (bg.startsWith('rgb')) {
      trailColor = bg.replace('rgb', 'rgba').replace(')', ', 0.3)');
    }

    this.ctx.fillStyle = trailColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (const g of this.distantGalaxies) {
      this.ctx.beginPath();
      this.ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(200, 220, 255, ${g.alpha})`;
      this.ctx.fill();
    }

    this.ctx.save();
    this.ctx.translate(this.width / 2 + this.panX, this.height / 2 + this.panY);
    this.ctx.scale(this.zoomLevel, this.zoomLevel);
    this.ctx.translate(-this.width / 2, -this.height / 2);

    for (const rs of this.renderStars) {
      const { star, x, y, radius } = rs;
      const isLightMode = document.body.classList.contains("light-mode");
      
      // Determine color
      let color = isLightMode ? "#64748B" : "#556080"; 
      let glowColor = isLightMode ? "rgba(100, 116, 139, 0.3)" : "rgba(85, 96, 128, 0.5)";
      
      if (star.index === 0) {
        // Sun
        color = isLightMode ? "#F59E0B" : "#FFD700";
        glowColor = isLightMode ? "rgba(245, 158, 11, 0.6)" : "rgba(255, 215, 0, 0.8)";
      } else if (star.belongToCivi === "地球") {
        color = isLightMode ? "#2563EB" : "#00E5FF";
        glowColor = isLightMode ? "rgba(37, 99, 235, 0.5)" : "rgba(0, 229, 255, 0.8)";
      } else if (star.belongToCivi && star.belongToCivi !== "地球") {
        color = isLightMode ? "#DC2626" : "#FF5500";
        glowColor = isLightMode ? "rgba(220, 38, 38, 0.5)" : "rgba(255, 85, 0, 0.8)";
      } else if (star.found) {
        color = isLightMode ? "#475569" : "#AAAAAA";
      }

      // Draw Orbit (very faint)
      if (rs.orbitRadius > 0) {
        this.ctx.beginPath();
        this.ctx.ellipse(this.width/2, this.height/2, rs.orbitRadius, rs.orbitRadius * 0.8, 0, 0, Math.PI * 2);
        this.ctx.strokeStyle = isLightMode ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.03)";
        this.ctx.stroke();
      }

      // Draw Star
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.shadowBlur = isLightMode ? 10 : 15;
      this.ctx.shadowColor = glowColor;
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // Reset

      // Selection / Hover rings
      if (this.selectedStar === rs || this.hoveredStar === rs) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.selectedStar === rs ? (isLightMode ? "#1E293B" : "#FFFFFF") : glowColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw Name text
        this.ctx.fillStyle = isLightMode ? "#1E293B" : "#FFFFFF";
        this.ctx.font = "bold 12px Orbitron, sans-serif";
        this.ctx.fillText(star.name, x + radius + 8, y + 4);
      }
    }

    // 绘制航行中的舰队
    const game = GameInstance.get();
    const isLightMode = document.body.classList.contains("light-mode");

    game.earthCivi.fleets.forEach(fleet => {
      if (fleet.eta > 0) {
        const srcStar = this.renderStars.find(s => s.star.index === fleet.sourceStarIndex);
        const dstStar = this.renderStars.find(s => s.star.index === fleet.targetStarIndex);

        if (srcStar && dstStar) {
          // 连线
          this.ctx.beginPath();
          this.ctx.moveTo(srcStar.x, srcStar.y);
          this.ctx.lineTo(dstStar.x, dstStar.y);
          this.ctx.strokeStyle = isLightMode ? "rgba(37, 99, 235, 0.3)" : "rgba(0, 229, 255, 0.2)";
          this.ctx.setLineDash([5, 5]);
          this.ctx.stroke();
          this.ctx.setLineDash([]);

          // 舰队当前位置插值
          const progress = 1 - (fleet.eta / fleet.totalEta);
          const fx = srcStar.x + (dstStar.x - srcStar.x) * progress;
          const fy = srcStar.y + (dstStar.y - srcStar.y) * progress;

          // 画舰队光点
          this.ctx.beginPath();
          this.ctx.arc(fx, fy, 4, 0, Math.PI * 2);
          this.ctx.fillStyle = isLightMode ? "#2563EB" : "#FFFFFF";
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = isLightMode ? "rgba(37, 99, 235, 0.5)" : "#00E5FF";
          this.ctx.fill();
          this.ctx.shadowBlur = 0;

          // 舰队名字
          this.ctx.fillStyle = isLightMode ? "#1E293B" : "#00E5FF";
          this.ctx.font = "bold 10px sans-serif";
          this.ctx.fillText(fleet.name, fx + 8, fy);
        }
      }
    });

    this.ctx.restore();
  }
}
