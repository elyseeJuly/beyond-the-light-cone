const fs = require('fs');
const path = require('path');

const eventsFile = path.join(__dirname, 'src/data/events.json');
let events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));

const newEvents = [
  {
    "name": 5,
    "eventtype": 0,
    "eventeffect": 0,
    "eventvalue": 0,
    "talkcount": 1,
    "talk0_pic": "event_sophon_blockade.png",
    "talk0_talker": "丁仪",
    "talk0_content": "他们把质子进行了二维展开...不仅如此，所有的粒子加速器都得出了荒唐的结论。物理学真的被锁死了，我们就像火鸡一样等待着感恩节。",
    "effects": [
      {
        "type": "flag",
        "target": "sophon_blockade_confirmed"
      },
      {
        "type": "resource",
        "target": "economy",
        "value": -50
      },
      {
        "type": "resource",
        "target": "culture",
        "value": -20
      }
    ],
    "triggerCondition": {
      "epoch": "CRISIS",
      "minYear": 5
    }
  },
  {
    "name": 199,
    "eventtype": 0,
    "eventeffect": 0,
    "eventvalue": 0,
    "talkcount": 1,
    "talk0_pic": "event_teardrop_probe.png",
    "talk0_talker": "丁仪",
    "talk0_content": "这根本不是什么艺术品...它太完美了，完美得没有任何人类工艺的痕迹。这是三体人的探测器！傻孩子们，快跑啊！！",
    "effects": [
      {
        "type": "flag",
        "target": "teardrop_arrived"
      },
      {
        "type": "resource",
        "target": "treachery",
        "value": 15
      }
    ],
    "triggerCondition": {
      "epoch": "CRISIS",
      "minYear": 199
    }
  },
  {
    "name": 290,
    "eventtype": 0,
    "eventeffect": 0,
    "eventvalue": 0,
    "talkcount": 1,
    "talk0_pic": "event_black_domain.png",
    "talk0_talker": "联邦政府",
    "talk0_content": "今天，我们正式向全宇宙发布安全声明：我们将把太阳系包裹在光速极慢的黑域之中，主动断绝与外界的任何联系，以证明我们对任何文明都不构成威胁。",
    "effects": [
      {
        "type": "flag",
        "target": "black_domain_decision"
      },
      {
        "type": "resource",
        "target": "prestige",
        "value": -30
      }
    ],
    "triggerCondition": {
      "epoch": "BUNKER",
      "minYear": 290
    }
  },
  {
    "name": 295,
    "eventtype": 0,
    "eventeffect": 0,
    "eventvalue": 0,
    "talkcount": 1,
    "talk0_pic": "event_lightspeed_ship.png",
    "talk0_talker": "星环集团科学家",
    "talk0_content": "星环号成功进入了曲率驱动模式！我们在空间中留下了清晰的航迹...光速飞船不再是理论了。即使掩体世界毁灭，人类也拥有了逃亡银河系的希望。",
    "effects": [
      {
        "type": "flag",
        "target": "lightspeed_ship_tested"
      },
      {
        "type": "resource",
        "target": "culture",
        "value": 50
      }
    ],
    "triggerCondition": {
      "epoch": "BUNKER",
      "minYear": 295
    }
  },
  {
    "name": 340,
    "eventtype": 0,
    "eventeffect": 0,
    "eventvalue": 0,
    "talkcount": 1,
    "talk0_pic": "event_dimensional_warning.png",
    "talk0_talker": "太阳系预警系统",
    "talk0_content": "【最高警报】奥尔特星云边缘发现以光速逼近的异常物体！形态为长8.5厘米、宽5.2厘米的二维薄片...重复，这不是光粒，这是降维打击武器，二向箔！",
    "effects": [
      {
        "type": "flag",
        "target": "dimensional_alert_seen"
      },
      {
        "type": "resource",
        "target": "treachery",
        "value": 50
      }
    ],
    "triggerCondition": {
      "epoch": "BUNKER",
      "minYear": 340
    }
  },
  {
    "name": 365,
    "eventtype": 0,
    "eventeffect": 0,
    "eventvalue": 0,
    "talkcount": 1,
    "talk0_pic": "event_galaxy_exodus.png",
    "talk0_talker": "星环号舰长",
    "talk0_content": "太阳系的三维结构正在我们身后崩塌。地球、木星、甚至是太阳，都化作了巨幅的死寂画卷。我们是最后的人类火种，目标：半人马座！再见了，太阳系。",
    "effects": [
      {
        "type": "flag",
        "target": "galaxy_exodus_seen"
      },
      {
        "type": "resource",
        "target": "population",
        "value": -80
      },
      {
        "type": "resource",
        "target": "economy",
        "value": -400
      }
    ],
    "triggerCondition": {
      "epoch": "BUNKER",
      "minYear": 365
    }
  },
  {
    "name": 400,
    "eventtype": 0,
    "eventeffect": 0,
    "eventvalue": 0,
    "talkcount": 1,
    "talk0_pic": "event_zeroer_broadcast.png",
    "talk0_talker": "归零者播报",
    "talk0_content": "【超膜广播】我们宇宙的总质量减少至临界值以下，宇宙将由封闭转为开放。请所有隐藏在小宇宙中的文明，交还你们借走的质量。我们将重启宇宙，回到十一维的田园时代。",
    "effects": [
      {
        "type": "flag",
        "target": "zero_homer_contacted"
      },
      {
        "type": "resource",
        "target": "culture",
        "value": 100
      }
    ],
    "triggerCondition": {
      "epoch": "GALAXY",
      "minYear": 400
    }
  }
];

events.push(...newEvents);
events.sort((a, b) => a.name - b.name);

fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
console.log("Events added successfully!");
