import React, { useMemo } from 'react';
import { Video, Audio, Sequence, interpolate, useCurrentFrame, staticFile, Img, Easing, random } from 'remotion';

const fps = 25;

// Continuous Audio Track
const AudioTrack: React.FC<{ audioSrc: string }> = ({ audioSrc }) => {
  const frame = useCurrentFrame();
  const totalFrames = 2250; // 90s
  const volume = interpolate(frame, [0, 50, totalFrames - 100, totalFrames], [0.0, 1.0, 1.0, 0.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <Audio src={audioSrc} trimBefore={55 * fps} volume={volume} />;
};

// Minimalist Title Card Component
const MinimalistTitleCard: React.FC<{ mainText: string; subText?: string; duration: number; fadeOut?: boolean }> = ({ mainText, subText, duration, fadeOut = false }) => {
  const frame = useCurrentFrame();
  const opacity = fadeOut 
    ? interpolate(frame, [0, 20, duration - 20, duration], [0, 1, 1, 0], { extrapolateRight: 'clamp' })
    : interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, duration], [1, 1.05]);
  const blur = interpolate(frame, [0, 20], [10, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{ flex: 1, backgroundColor: '#000', opacity, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{
        color: '#ffffff',
        fontSize: mainText.length > 12 ? 48 : 64,
        fontWeight: 100,
        letterSpacing: mainText.length > 12 ? '0.2em' : '0.8em',
        textAlign: 'center',
        margin: 0,
        textTransform: 'uppercase',
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
        textShadow: '0px 0px 20px rgba(255,255,255,0.2)'
      }}>
        {mainText}
      </h1>
      {subText && (
        <h2 style={{
          color: '#aaaaaa',
          fontSize: 24,
          fontWeight: 300,
          letterSpacing: '0.4em',
          marginTop: 40,
          transform: `scale(${scale})`,
          filter: `blur(${blur}px)`
        }}>
          {subText}
        </h2>
      )}
    </div>
  );
};

const MinimalistGameplayWithText: React.FC<{ src: string; startFrame: number; duration: number; speed?: number; text?: string }> = ({ src, startFrame, duration, speed = 1, text }) => {
  const frame = useCurrentFrame();
  const textOpacity = interpolate(frame, [10, 25, duration - 25, duration - 10], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{ flex: 1, backgroundColor: '#000', opacity: 1, position: 'relative' }}>
      <Video 
        src={staticFile(src)} 
        startFrom={startFrame} 
        playbackRate={speed} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: text ? 0.6 : 1.0 }} 
      />
      {text && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{
            color: '#fff',
            fontSize: 48,
            fontWeight: 200,
            letterSpacing: '0.4em',
            opacity: textOpacity,
            textShadow: '0 0 40px rgba(0,0,0,0.8)'
          }}>
            {text}
          </h2>
        </div>
      )}
    </div>
  );
};

// 3D Photo Wall Sequence
const PhotoWall3D: React.FC<{ portraits: string[]; duration: number; lang?: 'en' | 'zh' }> = ({ portraits, duration, lang = 'en' }) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const cameraZ = interpolate(frame, [0, duration], [-500, 4500]);

  const photos = useMemo(() => {
    return portraits.map((src, i) => {
      const seed = i;
      const x = random(`x-${seed}`) * 3000 - 1500; 
      const y = random(`y-${seed}`) * 1500 - 750;
      const z = random(`z-${seed}`) * 5500;
      const rotateY = random(`ry-${seed}`) * 40 - 20;
      const rotateX = random(`rx-${seed}`) * 20 - 10;
      const scale = random(`scale-${seed}`) * 0.5 + 0.8;
      
      return { src, x, y, z, rotateX, rotateY, scale };
    }).sort((a, b) => b.z - a.z);
  }, [portraits]);

  return (
    <div style={{ 
      flex: 1, 
      backgroundColor: '#030303', 
      opacity, 
      perspective: '800px', 
      overflow: 'hidden', 
      position: 'relative' 
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transformStyle: 'preserve-3d',
        transform: `translateZ(${cameraZ}px)`
      }}>
        {photos.map((p, i) => {
          const dist = p.z - cameraZ;
          if (dist < -500) return null;
          
          const focalPlane = cameraZ + 1000;
          const distToFocus = Math.abs(p.z - focalPlane);
          const blurAmount = interpolate(distToFocus, [0, 800, 2000], [0, 5, 20], { extrapolateRight: 'clamp' });
          
          return (
            <div key={i} style={{
              position: 'absolute',
              transformStyle: 'preserve-3d',
              transform: `translate3d(${p.x}px, ${p.y}px, ${-p.z}px) rotateX(${p.rotateX}deg) rotateY(${p.rotateY}deg) scale(${p.scale})`,
              marginLeft: '-250px',
              marginTop: '-350px',
              width: '500px',
              height: '700px'
            }}>
              <Img src={staticFile(p.src)} style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: `blur(${blurAmount}px) drop-shadow(0 0 30px rgba(255,255,255,0.05))`,
                opacity: interpolate(dist, [-300, 0], [0, 1], { extrapolateRight: 'clamp' })
              }} />
            </div>
          );
        })}
      </div>
      
      <div style={{ position: 'absolute', bottom: '15%', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <h2 style={{
          color: '#ffffff',
          fontSize: 32,
          fontWeight: 300,
          letterSpacing: lang === 'zh' ? '0.2em' : '0.5em',
          opacity: interpolate(frame, [25, 75, duration - 25, duration], [0, 1, 1, 0]),
          textTransform: 'uppercase',
          textShadow: '0 0 20px rgba(0,0,0,1)'
        }}>
          {lang === 'zh' ? '36位史诗人物' : '36 EPIC CHARACTERS'}
        </h2>
      </div>
    </div>
  );
};

// Fast Climax Clip with dynamic alternating scaling
const ClimaxClip: React.FC<{ src: string; isCg?: boolean; startFrame: number; duration: number; speed?: number; index: number }> = ({ src, isCg, startFrame, duration, speed = 1, index }) => {
  const frame = useCurrentFrame();
  
  const scale = index % 2 === 0 
    ? interpolate(frame, [0, duration], [1.1, 1.0]) 
    : interpolate(frame, [0, duration], [1.0, 1.1]);

  return (
    <div style={{ flex: 1, backgroundColor: '#000', opacity: 1, position: 'relative', overflow: 'hidden' }}>
      {isCg ? (
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }} />
      ) : (
        <Video 
          src={staticFile(src)} 
          startFrom={startFrame} 
          playbackRate={speed} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }} 
        />
      )}
    </div>
  );
};

export const BeyondTheLightConePromo: React.FC<{ lang?: 'en' | 'zh' }> = ({ lang = 'en' }) => {
  const audioSrc = staticFile('source/The_Pilgrim_Hymn-source.mp4');
  
  const allCharacters = [
    'images/unified_aiaa_1779691888124.png', 'images/unified_baibing_1779713036549.png', 'images/unified_beihai_1778921366897.png',
    'images/unified_changweisi_1779691759159.png', 'images/unified_chengxin_1778921400346.png', 'images/unified_dashi_1778921331273.png',
    'images/unified_dingyi_1779691512032.png', 'images/unified_dongfang_1779691773663.png', 'images/unified_evans_1779691557999.png',
    'images/unified_guanyifan_1779691901857.png', 'images/unified_hawking_1780649926625.png', 'images/unified_hines_1779691718751.png',
    'images/unified_huahua_1780649946315.png', 'images/unified_huatang_1779713110568.png', 'images/unified_keiko_1779713141458.png',
    'images/unified_leizhicheng_1779713006589.png', 'images/unified_linyun_1779691542667.png', 'images/unified_liucixin_1779712937103.png',
    'images/unified_luoji_1778921262534.png', 'images/unified_miaofuquan_1779713095135.png', 'images/unified_reydiaz_1779691732536.png',
    'images/unified_say_1780649885202.png', 'images/unified_shenyuan_1779691919176.png', 'images/unified_shuiwa_1779712987486.png',
    'images/unified_sophon_1778921509458.png', 'images/unified_tianming_1778921470963.png', 'images/unified_tyler_1779691745991.png',
    'images/unified_wade_1778921437022.png', 'images/unified_wangmiao_1779691527760.png', 'images/unified_yangdong_1779691583143.png',
    'images/unified_yangweining_1779713020653.png', 'images/unified_yanjing_1780649978771.png', 'images/unified_yewenjie_1778921299091.png',
    'images/unified_yiyi_1780649999542.png', 'images/unified_zhuangyan_1779712921189.png', 'images/unified_zhuhanyang_1779713125007.png'
  ];

  return (
    <div style={{ flex: 1, backgroundColor: '#000000', position: 'relative', fontFamily: '"SF Pro Display", "Inter", -apple-system, sans-serif', width: '1280px', height: '720px', overflow: 'hidden' }}>
      
      <Sequence from={0} durationInFrames={2250} layout="none">
        <AudioTrack audioSrc={audioSrc} />
      </Sequence>
      
      <Sequence from={0} durationInFrames={100} layout="absolute-fill">
        <MinimalistTitleCard mainText={lang === 'zh' ? "光锥之外" : "BEYOND THE LIGHT CONE"} subText="基于三体宇宙的4x硬核策略同人单机游戏" duration={100} fadeOut={false} />
      </Sequence>
      <Sequence from={100} durationInFrames={275} layout="absolute-fill">
        <MinimalistGameplayWithText src="segments/02-crisis-and-deterrence-era-cinematics.mp4" startFrame={0} duration={275} speed={1.5} text={lang === 'zh' ? "六大文明纪元" : "SIX CIVILIZATION ERAS"} />
      </Sequence>
      <Sequence from={375} durationInFrames={125} layout="absolute-fill">
        <MinimalistGameplayWithText src="segments/03-technology-research-and-unlock.mp4" startFrame={0} duration={125} speed={1.5} text={lang === 'zh' ? "85项核心科技" : "85-NODE TECH TREE"} />
      </Sequence>
      <Sequence from={500} durationInFrames={125} layout="absolute-fill">
        <MinimalistGameplayWithText src="segments/03-technology-research-and-unlock.mp4" startFrame={250} duration={125} speed={1.2} />
      </Sequence>

      <Sequence from={625} durationInFrames={375} layout="absolute-fill">
        <PhotoWall3D portraits={allCharacters} duration={375} lang={lang} />
      </Sequence>

      <Sequence from={1000} durationInFrames={125} layout="absolute-fill">
        <MinimalistGameplayWithText src="segments/04-government-cabinets-and-diplomacy.mp4" startFrame={0} duration={125} speed={1.2} />
      </Sequence>

      <Sequence from={1125} durationInFrames={100} layout="absolute-fill"><ClimaxClip src="segments/05-intelligence-and-space-battle.mp4" startFrame={100} duration={100} speed={1.5} index={0} /></Sequence>
      <Sequence from={1225} durationInFrames={60} layout="absolute-fill"><ClimaxClip src="images/cg_droplet_attack.png" isCg startFrame={0} duration={60} index={1} /></Sequence>
      
      <Sequence from={1285} durationInFrames={100} layout="absolute-fill"><ClimaxClip src="segments/01-cover-star-map-and-construction.mp4" startFrame={250} duration={100} speed={2.0} index={2} /></Sequence>
      <Sequence from={1385} durationInFrames={60} layout="absolute-fill"><ClimaxClip src="images/cg_dimensional_strike.png" isCg startFrame={0} duration={60} index={3} /></Sequence>
      
      <Sequence from={1445} durationInFrames={100} layout="absolute-fill"><ClimaxClip src="segments/06-chronicles-and-civilization-museum.mp4" startFrame={100} duration={100} speed={1.5} index={4} /></Sequence>
      <Sequence from={1545} durationInFrames={60} layout="absolute-fill"><ClimaxClip src="images/cg_solar_system_flattened.png" isCg startFrame={0} duration={60} index={5} /></Sequence>
      
      <Sequence from={1605} durationInFrames={100} layout="absolute-fill"><ClimaxClip src="segments/04-government-cabinets-and-diplomacy.mp4" startFrame={400} duration={100} speed={1.5} index={6} /></Sequence>
      <Sequence from={1705} durationInFrames={60} layout="absolute-fill"><ClimaxClip src="images/cg_trisolaris_destroyed.png" isCg startFrame={0} duration={60} index={7} /></Sequence>
      
      <Sequence from={1765} durationInFrames={100} layout="absolute-fill"><ClimaxClip src="segments/02-crisis-and-deterrence-era-cinematics.mp4" startFrame={450} duration={100} speed={2.0} index={8} /></Sequence>
      <Sequence from={1865} durationInFrames={60} layout="absolute-fill"><ClimaxClip src="images/cg_moon_crisis.png" isCg startFrame={0} duration={60} index={9} /></Sequence>
      
      <Sequence from={1925} durationInFrames={100} layout="absolute-fill"><ClimaxClip src="segments/05-intelligence-and-space-battle.mp4" startFrame={450} duration={100} speed={2.0} index={10} /></Sequence>
      <Sequence from={2025} durationInFrames={100} layout="absolute-fill"><ClimaxClip src="images/cg_wandering_earth.png" isCg startFrame={0} duration={100} index={11} /></Sequence>

      <Sequence from={2125} durationInFrames={125} layout="absolute-fill">
        <MinimalistTitleCard mainText="光锥之外·纪年往事现已正式发布" duration={125} fadeOut={true} />
      </Sequence>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '70px', backgroundColor: '#000000', zIndex: 100 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', backgroundColor: '#000000', zIndex: 100 }} />
    </div>
  );
};
