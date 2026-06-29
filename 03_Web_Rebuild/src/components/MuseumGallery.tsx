import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, X, Clock, Music, Play, Pause, Disc, Lock, RotateCcw, Check, Volume2, Eye, Image as ImageIcon } from 'lucide-react';
import { EndingCollectionGrid } from './ending/EndingCollectionGrid';
import { SaveManager } from '../core/SaveManager';
import { getAssetUrl } from '../utils/assetUrl';
import { GameInstance } from '../core/Game';
import { StatisticsManager } from '../core/StatisticsManager';
import { TimelineComparisonPanel } from './TimelineComparisonPanel';


interface CgEvent {
  id: string;
  name: string;
  description: string;
  image: string;
  era: string;
  hint: string;
}

const CG_EVENTS: CgEvent[] = [
  {
    id: "event_red_shore_base",
    name: "红岸基地建立",
    description: "在大兴安岭深处，红岸基地悄然建立，承载着向太空探寻生命的最初渴望。",
    image: "cg_red_shore_base.png",
    era: "黄金岁月",
    hint: "在黄金岁月自动触发"
  },
  {
    id: "event_yewenjie_signal",
    name: "叶文洁的呼唤",
    description: "“到这里来吧，我将帮助你们获得这个世界。”这声呼唤彻底改变了人类的命运。",
    image: "cg_yewenjie_signal.png",
    era: "黄金岁月",
    hint: "在黄金岁月选择【向宇宙发送红岸信号】触发"
  },
  {
    id: "event_trisolaris_reply",
    name: "三体文明回复",
    description: "来自遥远异星文明的警告：“不要回答！不要回答！不要回答！”但文明的齿轮已然合上。",
    image: "cg_trisolaris_reply.png",
    era: "黄金岁月",
    hint: "在发送信号后自动触发"
  },
  {
    id: "event_eto_founded",
    name: "地球三体组织成立",
    description: "人类精英的秘密聚会，高呼“消灭人类暴政，世界属于三体”，ETO 宣告诞生。",
    image: "cg_eto_founded.png",
    era: "黄金岁月",
    hint: "在危机纪元前夕接触伊文斯建立 ETO 触发"
  },
  {
    id: "event_crisis_start",
    name: "危机纪元开启",
    description: "智子展开，封锁人类基础科学。末日之剑高悬，危机纪元大幕沉重开启。",
    image: "cg_crisis_start.png",
    era: "危机纪元",
    hint: "经历危机纪元更替自动触发"
  },
  {
    id: "event_sophon_blockade",
    name: "智子锁死科学",
    description: "三体智子干扰高能加速器，将人类基础物理锁死在现有水平，切断前沿探索。",
    image: "cg_sophon_blockade.png",
    era: "危机纪元",
    hint: "经历智子封锁科学事件触发"
  },
  {
    id: "event_guzheng",
    name: "古筝行动",
    description: "在巴拿马运河，死亡的琴弦拂过，“审判日”号在一片寂静中被切割成薄片，彻底揭开了智子的秘密。",
    image: "cg_guzheng.png",
    era: "危机纪元",
    hint: "在危机纪元早期批准实施【古筝行动】触发"
  },
  {
    id: "event_moon_crisis",
    name: "月球危机",
    description: "危机纪元中期的月球轨道核弹危机，人类不得不直面无垠深空带来的技术壁垒与考验。",
    image: "cg_moon_crisis.png",
    era: "危机纪元",
    hint: "在危机纪元第 50 年自动触发"
  },
  {
    id: "event_beihai_assassination",
    name: "自然选择号启航",
    description: "章北海为了人类的延续，坚决执行飞船的太空出逃，刺杀顽固守旧派，留下深空火种。",
    image: "cg_beihai_assassination.png",
    era: "危机纪元",
    hint: "任命章北海并推进太空军工程触发"
  },
  {
    id: "event_teardrop_probe",
    name: "水滴到达太阳系",
    description: "三体探测器“水滴”以优美而冷酷的强互作用力外壳抵达太阳系，震撼人类世界。",
    image: "cg_teardrop_probe.png",
    era: "危机纪元",
    hint: "经历水滴探测器到达剧情事件触发"
  },
  {
    id: "event_droplet_attack",
    name: "末日战役 (水滴突袭)",
    description: "仅仅一颗微不足道的水滴，便如死神的穿梭针般，瞬间在太空中将人类两千多艘主力战舰化为火海。",
    image: "cg_droplet_attack.png",
    era: "危机纪元",
    hint: "遭遇三体水滴探测器交火触发"
  },
  {
    id: "event_deterrence_established",
    name: "威慑建立 (执剑诞生)",
    description: "罗辑手握毁灭双世界的遥控器，以生命为筹码，迫使三体文明妥协，威慑纪元正式建立。",
    image: "cg_deterrence_established.png",
    era: "威慑纪元",
    hint: "罗辑成功建立黑暗森林威慑触发"
  },
  {
    id: "event_black_domain",
    name: "黑域安全声明论证",
    description: "人类内部关于降低光速、在太阳系周围建立永久安全黑域以躲避黑森打击的可行性论证。",
    image: "cg_black_domain_debate.png",
    era: "威慑纪元",
    hint: "经历黑域计划讨论事件触发"
  },
  {
    id: "event_deterrence_broken",
    name: "威慑中止 (强袭废墟)",
    description: "执剑人交接的刹那，强互作用力水滴瞬间摧毁了所有的引力波广播天线，威慑崩塌。",
    image: "cg_deterrence_broken.png",
    era: "威慑纪元",
    hint: "程心接任执剑人并遭遇水滴突袭触发"
  },
  {
    id: "event_gravitational_broadcast",
    name: "引力波广播",
    description: "“万有引力”号飞船在太空中广播了三体世界的坐标，黑暗森林的死神开始向两个世界踱步。",
    image: "cg_gravitational_broadcast.png",
    era: "广播纪元",
    hint: "万有引力号触发重力广播触发"
  },
  {
    id: "event_bunker_world",
    name: "掩体世界太空城",
    description: "利用巨行星的阴影作为掩体，人类建立了宏大的太空城群，以躲避黑暗森林打击。",
    image: "cg_bunker_world.png",
    era: "掩体纪元",
    hint: "经历掩体纪元更替自动触发"
  },
  {
    id: "event_lightspeed_ship",
    name: "曲率光速飞船研发",
    description: "维德在星环集团的暗中支持下，秘密开展人类首艘曲率驱动光速飞船的科研攻关。",
    image: "cg_lightspeed_ship.png",
    era: "掩体纪元",
    hint: "经历曲率光速飞船建造事件触发"
  },
  {
    id: "event_wandering_earth",
    name: "行星发动机启航",
    description: "行星发动机在地表喷射出幽蓝火柱，带着故土的温存，人类决意开始长达数千年的星际远征。",
    image: "cg_wandering_earth.png",
    era: "掩体纪元",
    hint: "在掩体纪元第 300 年选择启动行星远征触发"
  },
  {
    id: "event_dimensional_warning",
    name: "奥尔特星云重力凹陷",
    description: "雷达捕捉到太阳系边缘空间出现严重的引力塌缩，维度打击迫在眉睫的灾难前兆。",
    image: "cg_dimensional_warning.png",
    era: "掩体纪元",
    hint: "经历空间维度警报剧情事件触发"
  },
  {
    id: "event_pluto_museum",
    name: "冥王星博物馆",
    description: "在太阳系的边缘，冥王星上建立起人类文明的最后遗迹博物馆，记录着这个种族存在过的痕迹。",
    image: "cg_pluto_museum.png",
    era: "银河纪元",
    hint: "遭遇二维化打击时进入冥王星触发"
  },
  {
    id: "event_solar_system_flattened",
    name: "太阳系二维化",
    description: "歌者抛出的二向箔展开，太阳系的一切物质跌落为没有厚度的二维画作，人类无声谢幕。",
    image: "cg_solar_system_flattened.png",
    era: "银河纪元",
    hint: "遭遇二向箔打击并降维失败触发"
  },
  {
    id: "event_galaxy_exodus",
    name: "银河远征星舰集结",
    description: "太阳系崩塌后，逃脱的光速飞船在银河深处汇合，星舰文明的人类向着未知远海启航。",
    image: "cg_galaxy_exodus.png",
    era: "银河纪元",
    hint: "经历银河远征启航剧情事件触发"
  },
  {
    id: "event_zeroer_broadcast",
    name: "归零者超空间广播",
    description: "归零者向全宇宙广播归还大宇宙质量的超维倡议，推动宇宙重启至原始的十维田园状态。",
    image: "cg_zeroer_broadcast.png",
    era: "星屑纪元",
    hint: "经历归零者超空间广播事件触发"
  }
];

interface Props {
  onClose: () => void;
}

interface Track {
  name: string;
  englishName: string;
  path: string;
  description: string;
  isEnding: boolean;
  unlockConditionText: string;
  unlockCheck: (unlocks: Set<string>) => boolean;
  promptText?: string;
}

const SOUNDTRACKS: Track[] = [
  // Era BGMs
  {
    name: "岁月底座",
    englishName: "Theme Base",
    path: "/audio/era_years_base.mp3",
    description: "黄金岁月与主界面背景乐。庄严的主导动机，诠释人类迈向太空的坚实底座。",
    isEnding: false,
    unlockConditionText: "默认解锁",
    unlockCheck: () => true,
    promptText: "Leitmotif, Majestic orchestral theme, space age brass"
  },
  {
    name: "危机之潮",
    englishName: "Crisis Era BGM",
    path: "/audio/era_crisis.mp3",
    description: "危机纪元背景乐。沉重工业管弦，如时钟般无情滴答，昭示末日倒计时的压迫感。",
    isEnding: false,
    unlockConditionText: "默认解锁",
    unlockCheck: () => true,
    promptText: "Heavy industrial orchestral, industrial heartbeat pulse, planetary engine construction"
  },
  {
    name: "执剑低吟",
    englishName: "Deterrence Era BGM",
    path: "/audio/era_deterrence.mp3",
    description: "威慑纪元背景乐。极简暗色氛围，悬而未决的低音大提琴，如钢丝上的脆弱平衡。",
    isEnding: false,
    unlockConditionText: "默认解锁",
    unlockCheck: () => true,
    promptText: "Minimalist dark ambient, ultra-slow deep cello, suspended threat"
  },
  {
    name: "广播回响",
    englishName: "Broadcast Era BGM",
    path: "/audio/era_broadcast.mp3",
    description: "广播纪元背景乐。嘈杂交响金属，混杂着支离破碎的警报与电台杂音，秩序崩塌的终曲。",
    isEnding: false,
    unlockConditionText: "默认解锁",
    unlockCheck: () => true,
    promptText: "Chaotic symphonic metal fusion, fragmented radio transmission, existential panic"
  },
  {
    name: "深空掩体",
    englishName: "Bunker Era BGM",
    path: "/audio/era_bunker.mp3",
    description: "掩体纪元背景乐。沉闷的次低音与金属舱壁共振，仿佛躲藏在巨星阴影下的密闭太空城。",
    isEnding: false,
    unlockConditionText: "默认解锁",
    unlockCheck: () => true,
    promptText: "Muffled sub-bass, metal resonance, claustrophobic atmospheric, hiding in the dark"
  },
  {
    name: "银河孤舟",
    englishName: "Galaxy Era BGM",
    path: "/audio/era_galaxy.mp3",
    description: "银河纪元背景乐。辽阔的宇宙氛围中，孤独的单音钢琴回响，交织着虚无的女声哼唱。",
    isEnding: false,
    unlockConditionText: "默认解锁",
    unlockCheck: () => true,
    promptText: "Vast cosmic ambient, lonely solo piano, sweep cinematic strings, zero-gravity feel"
  },
  {
    name: "星屑余晖",
    englishName: "Stardust Era BGM",
    path: "/audio/era_stardust.mp3",
    description: "星屑纪元背景乐。空灵而唯美的后摇滚，闪烁的颗粒合成器音色，化作消散在太虚中的微光。",
    isEnding: false,
    unlockConditionText: "默认解锁",
    unlockCheck: () => true,
    promptText: "Ethereal post-rock, shimmering granular synthesis, decaying notes fading into the void"
  },

  // Vocal Themes
  {
    name: "Stardust Exodus (星屑启航)",
    englishName: "True Ending Vocal Theme",
    path: "/audio/ending_stardust_exodus.mp3",
    description: "【真结局主题曲】流浪远航 / 星际征服胜利。交响电子与空灵女声人声演唱，极具爆发力与史诗感。",
    isEnding: true,
    unlockConditionText: "达成「星际征服胜利」或「流浪胜利」解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_victory_0") || unlocks.has("unlocked_victory_3"),
    promptText: "J-RPG space opera, symphonic EDM, powerful anime-style female vocals, choir"
  },
  {
    name: "Fate Beyond the Light Cone (光锥之外的命运)",
    englishName: "Platinum Credits Vocal Theme",
    path: "/audio/ending_fate_beyond_the_light_cone.mp3",
    description: "【白金成就终章曲】全图鉴解锁演播。汉斯·季默式宏大交响乐，人声吟唱，文明永恒赞歌。",
    isEnding: true,
    unlockConditionText: "解锁所有结局解锁",
    unlockCheck: () => SaveManager.isAllEndingsUnlocked(),
    promptText: "Epic cinematic space opera, soulful and powerful female vocal, gradual build-up, Hans Zimmer style"
  },

  // Victory Epilogues
  {
    name: "征服之章 (Conquest Victory)",
    englishName: "Epilogue theme",
    path: "/audio/ending_conquest.mp3",
    description: "征服胜利结局配乐。冷酷的军乐铜管，宣告黑暗森林最强大猎手的凯旋。",
    isEnding: true,
    unlockConditionText: "达成「征服胜利」解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_victory_0"),
  },
  {
    name: "威慑和平 (Deterrence Victory)",
    englishName: "Epilogue theme",
    path: "/audio/ending_deterrence.mp3",
    description: "威慑胜利结局配乐。高悬的庄严旋律，夹杂着心跳起伏的低频，表现这难得却危如累卵的和平。",
    isEnding: true,
    unlockConditionText: "达成「威慑胜利」解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_victory_1"),
  },
  {
    name: "光锥之死 (Death of the Light Cone)",
    englishName: "Dark Domain Ending theme",
    path: "/audio/ending_death_of_the_light_cone.mp3",
    description: "黑域结局配乐。慢速安魂曲，神圣的无字唱诗班，凝固在降至零的永恒琥珀之中。",
    isEnding: true,
    unlockConditionText: "达成「黑域胜利」解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_victory_2"),
  },
  {
    name: "流浪远航 (Wandering Victory)",
    englishName: "Epilogue theme",
    path: "/audio/ending_wandering.mp3",
    description: "流浪胜利结局配乐。深邃而坚韧的管弦起伏，伴随发动机的重重推力，驶向遥远的半人马座。",
    isEnding: true,
    unlockConditionText: "达成「流浪胜利」解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_victory_3"),
  },
  {
    name: "量子幽灵 (Ghost in the Quantum)",
    englishName: "Digital Ending theme",
    path: "/audio/ending_ghost_in_the_quantum.mp3",
    description: "数字永生结局配乐。电子浪潮与冷酷的赛博朋克合成器，宣告碳基肉身的逝去，硅基意识之永恒。",
    isEnding: true,
    unlockConditionText: "达成「数字永生」解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_victory_4"),
  },
  {
    name: "最后的档案 (The Last Archive)",
    englishName: "Hidden Ending theme",
    path: "/audio/ending_the_last_archive.mp3",
    description: "隐藏结局配乐。忧伤的独奏钢琴与斑驳的老电台白噪音，最后翻书声落，归于绝对寂静。",
    isEnding: true,
    unlockConditionText: "达成「死神永生·小宇宙」结局解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_victory_5"),
  },

  // Defeat Epilogues
  {
    name: "内讧崩塌 (Treachery Defeat)",
    englishName: "Defeat theme",
    path: "/audio/ending_defeat_treachery.mp3",
    description: "逃亡主义失控失败配乐。凌乱扭曲的弦乐，刻画无序内耗中逐渐熄灭的人性与文明秩序。",
    isEnding: true,
    unlockConditionText: "达成「文明崩溃（逃亡主义失控）」结局解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_defeat_0"),
  },
  {
    name: "死寂星尘 (Extinction Defeat)",
    englishName: "Defeat theme",
    path: "/audio/ending_defeat_extinction.mp3",
    description: "文明灭绝失败配乐。单调的电磁背景音与宇宙风暴，记录归于尘埃后的死寂星球。",
    isEnding: true,
    unlockConditionText: "达成「文明灭绝（最后的沉默）」结局解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_defeat_1"),
  },
  {
    name: "恒星终焉 (Helium Flash Defeat)",
    englishName: "Defeat theme",
    path: "/audio/ending_defeat_helium_flash.mp3",
    description: "太阳氦闪失败配乐。突然膨胀 of 轰鸣管弦与极致的爆发感，在白光中蒸发一切遗恨。",
    isEnding: true,
    unlockConditionText: "达成「太阳氦闪（恒星终焉）」结局解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_defeat_2"),
  },
  {
    name: "纸面永眠 (Dimension Strike Defeat)",
    englishName: "Defeat theme",
    path: "/audio/ending_defeat_dimension_strike.mp3",
    description: "二向箔降维打击失败配乐。奇异的频率坍缩，三维物质跌落平原时的空虚啸叫。",
    isEnding: true,
    unlockConditionText: "达成「二向箔降维（空间坍缩）」结局解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_defeat_3"),
  },

  // Neutral Epilogues
  {
    name: "无尽漂流 (Eternal Exile)",
    englishName: "Neutral Exile theme",
    path: "/audio/ending_neutral_eternal_exile.mp3",
    description: "永恒的流亡结局配乐。迷茫而苍凉的电子低吟，诉说着失去太阳的人类在幽暗虚空中的无尽漂泊。",
    isEnding: true,
    unlockConditionText: "达成「永恒的流亡」结局解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_neutral_0") || unlocks.has("unlocked_neutral_ETERNAL_EXILE"),
  },
  {
    name: "星海归于静默 (Cosmic Silence)",
    englishName: "Neutral Silence theme",
    path: "/audio/ending_neutral_cosmic_silence.mp3",
    description: "宇宙静默结局配乐。微弱舒缓的电磁背景音与渐行渐远的长笛，宣告一个喧嚣种族的终极宁静。",
    isEnding: true,
    unlockConditionText: "达成「宇宙静默」结局解锁",
    unlockCheck: (unlocks) => unlocks.has("unlocked_neutral_1") || unlocks.has("unlocked_neutral_COSMIC_SILENCE"),
  },
];

export const MuseumGallery: React.FC<Props> = ({ onClose }) => {
  const history = SaveManager.getEndingHistory();
  const [activeTab, setActiveTab] = useState<'chronicles' | 'cgGallery' | 'phonograph' | 'timeline'>('chronicles');
  const [selectedCg, setSelectedCg] = useState<CgEvent | null>(null);
  const [unlockedSet] = useState<Set<string>>(() => SaveManager.getEndingUnlocks());

  // Audio Preview Player States
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentPreviewPath, setCurrentPreviewPath] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previewVolume, setPreviewVolume] = useState(0.5);
  const [customBgm, setCustomBgm] = useState<string | null>(() => localStorage.getItem('game-custom-bgm'));

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize/ensure local audio instance
  const ensurePreviewAudio = () => {
    if (!previewAudioRef.current) {
      const audio = new Audio();
      audio.volume = previewVolume;

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      audio.addEventListener('durationchange', () => {
        setDuration(audio.duration || 0);
      });
      audio.addEventListener('ended', () => {
        setIsPlayingPreview(false);
        setCurrentTime(0);
      });
      previewAudioRef.current = audio;
    }
    return previewAudioRef.current;
  };

  // Cleanup on unmount (prevent audio leakage)
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const handlePlayPreview = (track: Track) => {
    const isUnlocked = track.unlockCheck(unlockedSet);
    if (!isUnlocked) return;

    const audio = ensurePreviewAudio();

    // Pause gameplay BGM to prevent overlap
    window.dispatchEvent(new CustomEvent('pause-main-bgm'));

    if (currentPreviewPath === track.path) {
      if (isPlayingPreview) {
        audio.pause();
        setIsPlayingPreview(false);
      } else {
        audio.play().catch(err => console.log('[Phonograph] Play failed:', err));
        setIsPlayingPreview(true);
      }
    } else {
      audio.src = getAssetUrl(track.path);
      audio.load();
      audio.play()
        .then(() => {
          setIsPlayingPreview(true);
        })
        .catch(err => {
          console.log('[Phonograph] Load & Play failed:', err);
          setIsPlayingPreview(false);
        });
      setCurrentPreviewPath(track.path);
      setCurrentTime(0);
    }
  };

  const handleSeek = (time: number) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setPreviewVolume(vol);
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = vol;
    }
  };

  const handleSetCustomBgm = (path: string) => {
    localStorage.setItem('game-custom-bgm', path);
    setCustomBgm(path);
    window.dispatchEvent(new CustomEvent('bgm-settings-changed'));
    if (isPlayingPreview) {
      window.dispatchEvent(new CustomEvent('pause-main-bgm'));
    }
  };

  const handleClearCustomBgm = () => {
    localStorage.removeItem('game-custom-bgm');
    setCustomBgm(null);
    window.dispatchEvent(new CustomEvent('bgm-settings-changed'));
    if (isPlayingPreview) {
      window.dispatchEvent(new CustomEvent('pause-main-bgm'));
    }
  };

  const currentPlayingTrack = SOUNDTRACKS.find(t => t.path === currentPreviewPath);

  // Helper formatting for audio time
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/98 overflow-y-auto flex justify-center p-6 md:p-12 animate-in fade-in duration-300">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

      <div className="w-full max-w-6xl relative z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-widest text-white uppercase italic">
                岁月史书 · 独立画廊
              </h1>
              <p className="text-white/40 text-sm tracking-wide mt-1">
                Museum Gallery // 记录平行宇宙中人类文明的纪元终章、属性馈赠与原声轨迹
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 border border-white/10 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer pointer-events-auto"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-white/10 pb-2 shrink-0">
          <button 
            onClick={() => setActiveTab('chronicles')}
            className={`px-5 py-2.5 font-mono text-sm tracking-widest uppercase transition-all duration-300 relative cursor-pointer ${
              activeTab === 'chronicles' 
                ? 'text-cyan-400 font-bold' 
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <span>星历终章</span>
            {activeTab === 'chronicles' && (
              <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-cyan-400 animate-pulse" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('cgGallery')}
            className={`px-5 py-2.5 font-mono text-sm tracking-widest uppercase transition-all duration-300 relative cursor-pointer ${
              activeTab === 'cgGallery' 
                ? 'text-cyan-400 font-bold' 
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              纪元浮光 (CG图鉴)
            </span>
            {activeTab === 'cgGallery' && (
              <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-cyan-400 animate-pulse" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('phonograph')}
            className={`px-5 py-2.5 font-mono text-sm tracking-widest uppercase transition-all duration-300 relative cursor-pointer ${
              activeTab === 'phonograph' 
                ? 'text-cyan-400 font-bold' 
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              星海留声机
            </span>
            {activeTab === 'phonograph' && (
              <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-cyan-400 animate-pulse" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`px-5 py-2.5 font-mono text-sm tracking-widest uppercase transition-all duration-300 relative cursor-pointer ${
              activeTab === 'timeline' 
                ? 'text-cyan-400 font-bold' 
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              双轨时间线
            </span>
            {activeTab === 'timeline' && (
              <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-cyan-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Tab 1: Chronicles & Collections */}
        {activeTab === 'chronicles' && (
          <div className="space-y-8 flex-1">
            {/* Ending Collection Grid */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-white/80 font-mono text-sm uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>结局收集与加成契约</span>
              </div>
              <EndingCollectionGrid />
            </section>

            {/* Ending Chronicles History List */}
            <section className="space-y-4 pb-12">
              <div className="flex items-center gap-2 text-white/80 font-mono text-sm uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>历史编年通关履历</span>
              </div>

              {history.length === 0 ? (
                <div className="p-8 border border-white/5 bg-white/[0.01] rounded-xl text-center">
                  <Clock className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm italic">暂无历史通关记录，请带带领袖们完成首个结局。</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...history].reverse().map((record, idx) => {
                    const epochLabels = ['黄金岁月', '危机纪元', '威慑纪元', '广播纪元', '掩体纪元', '银河纪元', '星屑纪元'];
                    const epochName = epochLabels[record.epoch] || '未知纪元';
                    const isVic = record.victoryType !== null;

                    return (
                      <div 
                        key={idx} 
                        className="flex flex-col md:flex-row md:items-center justify-between p-4.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold border ${
                            isVic 
                              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}>
                            {isVic ? '✓' : '✗'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{record.label}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-normal ${
                                isVic ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                              }`}>
                                {isVic ? 'VICTORY' : 'DEFEAT'}
                              </span>
                            </div>
                            <div className="text-[10px] text-white/40 mt-1 font-mono">
                              达成时间：{new Date(record.timestamp).toLocaleString()} | 纪元历程：{epochName} {record.year} 年
                            </div>
                          </div>
                        </div>

                        {record.keyFlags && record.keyFlags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {record.keyFlags.map((flag, fIdx) => (
                              <span 
                                key={fIdx} 
                                className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-white/50"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
        {/* Tab: Timeline Comparison */}
        {activeTab === 'timeline' && (
          <div className="flex-1 overflow-y-auto min-h-0 pb-12 flex justify-center">
            <TimelineComparisonPanel />
          </div>
        )}


        {/* Tab: CG Gallery */}
        {activeTab === 'cgGallery' && (
          <div className="space-y-6 pb-12 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-mono tracking-widest text-cyan-400 uppercase font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded bg-cyan-400" />
                纪元历史浮光 (Major Event CG Gallery)
              </h3>
              <span className="text-[10px] text-white/40 font-mono">
                已解锁 CG: {
                  (() => {
                    const stats = StatisticsManager.getStats();
                    const unlockedCount = CG_EVENTS.filter(cg => {
                      const statsUnlock = stats.eventsTriggered && (stats.eventsTriggered[cg.id] > 0 || stats.eventsTriggered[cg.id.replace('event_', 'cg_')] > 0);
                      const currentSessionUnlock = SaveManager.getEndingUnlocks().has(cg.id);
                      const timelineUnlock = (GameInstance.get()?.playerTimeline || []).some(t => t.event.includes(cg.name));
                      return statsUnlock || currentSessionUnlock || timelineUnlock;
                    }).length;
                    return `${unlockedCount} / ${CG_EVENTS.length}`;
                  })()
                }
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {CG_EVENTS.map(cg => {
                const stats = StatisticsManager.getStats();
                const isUnlocked = !!(
                  (stats.eventsTriggered && (stats.eventsTriggered[cg.id] > 0 || stats.eventsTriggered[cg.id.replace('event_', 'cg_')] > 0)) ||
                  unlockedSet.has(cg.id) ||
                  (GameInstance.get()?.playerTimeline || []).some(t => t.event.includes(cg.name))
                );

                return (
                  <div
                    key={cg.id}
                    onClick={() => isUnlocked && setSelectedCg(cg)}
                    className={`relative rounded-xl overflow-hidden border transition-all duration-300 flex flex-col justify-between group ${
                      isUnlocked 
                        ? 'border-white/10 hover:border-cyan-500/30 hover:scale-[1.03] cursor-pointer bg-slate-900/40 shadow-lg' 
                        : 'border-white/5 bg-slate-950/20 opacity-55 select-none'
                    }`}
                  >
                    {/* Image / Lock Container */}
                    <div className="relative aspect-[16/10] bg-slate-950/80 overflow-hidden flex items-center justify-center border-b border-white/5">
                      {isUnlocked ? (
                        <>
                          <img 
                            src={getAssetUrl(`images/${cg.image}`)} 
                            alt={cg.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (img.src.includes('cg_')) {
                                img.src = img.src.replace('cg_', 'event_');
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="p-2.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-400 backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                              <Eye className="w-5 h-5" />
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-white/20">
                          <Lock className="w-8 h-8 text-white/10" />
                          <span className="text-[10px] font-mono tracking-widest uppercase">LOCKED</span>
                        </div>
                      )}
                      
                      {/* Era badge */}
                      <span className="absolute top-2 left-2 text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-950/80 border border-white/10 text-white/60">
                        {cg.era}
                      </span>
                    </div>

                    {/* Metadata container */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <h4 className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-white/30 line-through'}`}>
                          {isUnlocked ? cg.name : '【未探索大事件】'}
                        </h4>
                        <p className={`text-[10px] leading-relaxed mt-1 font-light ${isUnlocked ? 'text-white/50' : 'text-white/20'}`}>
                          {isUnlocked ? cg.description : `解锁线索: ${cg.hint}`}
                        </p>
                      </div>
                      
                      {isUnlocked && (
                        <div className="text-[9px] font-mono text-cyan-400/60 uppercase tracking-widest self-end">
                          UNLOCKED
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Starsea Phonograph (Music Appreciation) */}
        {activeTab === 'phonograph' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-12 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Left side: Holographic Player Dashboard */}
            <div className="lg:col-span-4 lg:sticky lg:top-6 bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-6 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase self-start flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                正在播放预览
              </h3>

              {/* Record visualization container */}
              <div className="relative w-48 h-48 flex items-center justify-center mt-2 select-none">
                {/* Vinyl record */}
                <div 
                  className={`w-44 h-44 rounded-full border-4 border-slate-800 shadow-[0_0_25px_rgba(0,188,212,0.15)] flex items-center justify-center overflow-hidden transition-all duration-300 ${
                    isPlayingPreview ? 'animate-spin-slow' : 'animate-spin-slow animate-spin-paused'
                  }`}
                  style={{
                    background: 'repeating-radial-gradient(circle, #1e293b, #1e293b 2px, #0f172a 4px, #0f172a 6px)'
                  }}
                >
                  {/* Center label */}
                  <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-cyan-500/50 flex items-center justify-center relative">
                    <Disc className={`w-8 h-8 text-cyan-400 ${isPlayingPreview ? 'animate-pulse' : ''}`} />
                    <div className="absolute w-2 h-2 rounded-full bg-slate-950" />
                  </div>
                </div>

                {/* Tone arm */}
                <div 
                  className="absolute top-2 right-6 w-12 h-20 pointer-events-none origin-top transition-transform duration-700 ease-in-out z-20"
                  style={{
                    transform: isPlayingPreview ? 'rotate(18deg)' : 'rotate(-8deg)'
                  }}
                >
                  <div className="absolute right-3 top-0 w-[3px] h-14 bg-slate-400 shadow-[0_0_4px_rgba(255,255,255,0.3)] origin-top rounded-full" />
                  <div className="absolute right-1 top-[-4px] w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-500 shadow-md flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  </div>
                  <div className="absolute right-[8px] top-[50px] w-3 h-5 bg-slate-500 rounded-sm border border-slate-400 shadow-sm transform -rotate-12">
                    <div className={`w-1 h-1 rounded-full mx-auto mt-1 ${isPlayingPreview ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                  </div>
                </div>
              </div>

              {/* Wave bounce visualizer */}
              <div className="flex items-end justify-center gap-1 h-8 w-full px-4 mt-2">
                {[0.6, 0.4, 0.8, 0.5, 0.9, 0.7, 0.4, 0.6, 0.8, 0.5, 0.7, 0.4].map((dur, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-cyan-500/70 rounded-t-xs"
                    style={{
                      height: '100%',
                      animation: isPlayingPreview ? `wave-bounce ${dur}s ease-in-out infinite alternate` : 'none',
                      transform: isPlayingPreview ? 'none' : 'scaleY(0.15)',
                      transformOrigin: 'bottom',
                      transition: 'all 0.4s ease'
                    }}
                  />
                ))}
              </div>

              {/* Current track info */}
              <div className="text-center w-full min-h-[4rem] px-2 flex flex-col justify-center">
                {currentPlayingTrack ? (
                  <>
                    <h4 className="text-white text-base font-bold tracking-wide leading-tight truncate">
                      {currentPlayingTrack.name}
                    </h4>
                    <p className="text-white/40 text-[11px] font-mono tracking-wider mt-1 truncate">
                      {currentPlayingTrack.englishName}
                    </p>
                    {currentPlayingTrack.promptText && (
                      <p className="text-[9px] text-cyan-400/40 font-mono mt-1 leading-snug line-clamp-1 italic hover:line-clamp-2 hover:bg-white/5 p-1 rounded transition-all cursor-help" title={currentPlayingTrack.promptText}>
                        Prompt: {currentPlayingTrack.promptText}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h4 className="text-white/30 text-sm italic">请在右侧选择曲目播放</h4>
                    <p className="text-white/20 text-[10px] mt-1 font-mono">STANDBY MODE</p>
                  </>
                )}
              </div>

              {/* Playback Progress Slider */}
              <div className="w-full space-y-1.5">
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  disabled={!currentPreviewPath}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(to right, #22d3ee ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (duration || 1)) * 100}%)`
                  }}
                />
                <div className="flex justify-between text-[10px] font-mono text-white/40 select-none">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Player Dashboard Controls */}
              <div className="flex items-center gap-4 w-full justify-center">
                {/* Play/Pause Button */}
                <button 
                  onClick={() => currentPlayingTrack && handlePlayPreview(currentPlayingTrack)}
                  disabled={!currentPreviewPath}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer ${
                    currentPreviewPath 
                      ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:scale-105 active:scale-95' 
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                  title={isPlayingPreview ? "暂停" : "播放"}
                >
                  {isPlayingPreview ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-0.5" />}
                </button>

                {/* Volume slider */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-2 rounded-xl text-white/50 hover:text-white/80 transition-colors w-32">
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={previewVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    style={{
                      background: `linear-gradient(to right, #22d3ee ${previewVolume * 100}%, rgba(255,255,255,0.1) ${previewVolume * 100}%)`
                    }}
                  />
                </div>
              </div>

              {/* Global Custom BGM status */}
              {customBgm && (
                <div className="w-full mt-2 pt-4 border-t border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-cyan-950/20 border border-cyan-500/20 rounded-lg p-2.5">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest font-bold">已启用自定义背景乐</span>
                      <span className="text-xs text-white/70 font-bold mt-0.5 truncate max-w-[150px]">
                        《{SOUNDTRACKS.find(t => t.path === customBgm)?.name || '未知曲目'}》
                      </span>
                    </div>
                    <button 
                      onClick={handleClearCustomBgm}
                      className="p-1.5 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded text-white/40 transition-colors text-[10px] font-mono cursor-pointer flex items-center gap-1 border border-white/5"
                      title="清除并恢复纪元自动切换模式"
                    >
                      <RotateCcw className="w-3 h-3" />
                      恢复自动
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Music Track List */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Era BGMs */}
              <section className="space-y-3">
                <h3 className="text-sm font-mono tracking-widest text-cyan-400 uppercase font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded bg-cyan-400" />
                  纪元编年律动 (Gameplay Era BGMs)
                  <span className="text-[10px] text-white/30 font-normal tracking-wide lowercase italic font-sans">(支持设为游戏背景乐)</span>
                </h3>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {SOUNDTRACKS.filter(t => !t.isEnding).map((track, index) => {
                    const isCurrent = currentPreviewPath === track.path;
                    const isActiveBgm = customBgm === track.path;
                    const isPlayingThis = isCurrent && isPlayingPreview;

                    return (
                      <div 
                        key={index}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-xl border transition-all gap-4 bg-white/[0.01] ${
                          isCurrent 
                            ? 'border-cyan-500/40 bg-cyan-500/[0.03] shadow-[0_0_15px_rgba(6,182,212,0.05)]' 
                            : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Play circle */}
                          <button 
                            onClick={() => handlePlayPreview(track)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                              isCurrent 
                                ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md' 
                                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-cyan-400/50 hover:bg-cyan-500/10'
                            }`}
                          >
                            {isPlayingThis ? <Pause className="w-4 h-4 fill-current animate-pulse" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                          </button>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-white leading-tight">
                                {track.name}
                              </h4>
                              <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
                                {track.englishName}
                              </span>
                            </div>
                            <p className="text-xs text-white/50 leading-relaxed max-w-lg">
                              {track.description}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          {isActiveBgm ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-bold font-mono">
                              <Check className="w-3.5 h-3.5" />
                              使用中
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleSetCustomBgm(track.path)}
                              className="px-3 py-1.5 bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-400 border border-white/10 hover:border-cyan-500/30 text-white/70 rounded-lg text-xs font-mono transition-all cursor-pointer"
                            >
                              设为背景乐
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Theme & Ending BGMs */}
              <section className="space-y-3">
                <h3 className="text-sm font-mono tracking-widest text-purple-400 uppercase font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded bg-purple-400" />
                  史书大结局与特制主题曲 (Ending Themes)
                  <span className="text-[10px] text-white/30 font-normal tracking-wide lowercase italic font-sans">(达成对应结局解锁)</span>
                </h3>

                <div className="grid grid-cols-1 gap-2.5">
                  {SOUNDTRACKS.filter(t => t.isEnding).map((track, index) => {
                    const isUnlocked = track.unlockCheck(unlockedSet);
                    const isCurrent = currentPreviewPath === track.path;
                    const isPlayingThis = isCurrent && isPlayingPreview;

                    return (
                      <div 
                        key={index}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-xl border transition-all gap-4 ${
                          !isUnlocked 
                            ? 'bg-white/[0.002] border-white/5 opacity-55' 
                            : isCurrent
                              ? 'border-purple-500/40 bg-purple-500/[0.03] shadow-[0_0_15px_rgba(168,85,247,0.05)]'
                              : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Play circle / Lock status */}
                          {!isUnlocked ? (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-white/5 border-white/5 text-white/20">
                              <Lock className="w-4 h-4" />
                            </div>
                          ) : (
                            <button 
                              onClick={() => handlePlayPreview(track)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                                isCurrent 
                                  ? 'bg-purple-500 border-purple-400 text-slate-950 shadow-md' 
                                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-purple-400/50 hover:bg-purple-500/10'
                              }`}
                            >
                              {isPlayingThis ? <Pause className="w-4 h-4 fill-current animate-pulse" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                            </button>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-sm font-bold leading-tight ${isUnlocked ? 'text-white' : 'text-white/40 font-normal line-through'}`}>
                                {track.name}
                              </h4>
                              {isUnlocked && track.path.endsWith('.mp3') && (track.path.includes('stardust') || track.path.includes('fate')) && (
                                <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                                  Vocal (含人声)
                                </span>
                              )}
                              <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
                                {track.englishName}
                              </span>
                            </div>
                            <p className={`text-xs leading-relaxed max-w-lg ${isUnlocked ? 'text-white/50' : 'text-white/20'}`}>
                              {isUnlocked ? track.description : `[锁定状态] ${track.unlockConditionText}`}
                            </p>
                          </div>
                        </div>

                        {/* Actions / Badges */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          {isUnlocked ? (
                            <span className="text-[10px] font-mono text-purple-400/60 bg-purple-950/20 border border-purple-500/20 px-2 py-1 rounded-md">
                              结局特制曲
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-white/20 px-2 py-1 border border-white/5 rounded-md flex items-center gap-1.5">
                              <Lock className="w-3 h-3" />
                              已锁定
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

            </div>

          </div>
        )}
      </div>

      {/* Full-screen CG Modal */}
      {selectedCg && (
        <div className="fixed inset-0 z-[350] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <button 
            onClick={() => setSelectedCg(null)}
            className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full border border-white/10 transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-5xl w-full flex flex-col gap-4 relative">
            <img 
              src={getAssetUrl(`images/${selectedCg.image}`)} 
              alt={selectedCg.name}
              className="w-full max-h-[75vh] object-contain rounded-lg border border-white/10 shadow-2xl bg-slate-900"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src.includes('cg_')) {
                  img.src = img.src.replace('cg_', 'event_');
                }
              }}
            />
            <div className="p-4 bg-slate-900/80 border border-white/5 rounded-xl backdrop-blur-md">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-cyan-400 font-mono text-sm px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20">{selectedCg.era}</span>
                  {selectedCg.name}
                </h3>
              </div>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                {selectedCg.description}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        .animate-spin-paused {
          animation-play-state: paused;
        }
        @keyframes wave-bounce {
          0%, 100% { transform: scaleY(0.15); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};
