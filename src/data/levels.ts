export type SyntaxKey =
  | 'display'
  | 'justify-content'
  | 'align-items'
  | 'flex-direction'
  | 'flex-wrap'

export type FlexProperty = SyntaxKey

export interface SyntaxHint {
  label: string
  description: string
  values: string[]
}

export interface ExpectedDeclaration {
  selector?: string
  property: FlexProperty
  value: string
}

export interface ForbiddenDeclaration extends ExpectedDeclaration {
  selector: string
  message: string
}

export interface Ingredient {
  label: string
  tone: 'rice' | 'egg' | 'tea' | 'fish' | 'bean' | 'shrimp' | 'tomato' | 'nori'
}

export interface LevelPlan {
  id: number
  title: string
  focus: string
  objective: string
  target: string
  scope: string
  syntax: SyntaxKey[]
  starterCss: string
  expected: ExpectedDeclaration[]
  forbidden?: ForbiddenDeclaration[]
  ingredients: Ingredient[]
  successMessage: string
}

const basicIngredients: Ingredient[] = [
  { label: '飯糰', tone: 'rice' },
  { label: '玉子', tone: 'egg' },
  { label: '飲料', tone: 'tea' },
]

const partyIngredients: Ingredient[] = [
  { label: '飯糰', tone: 'rice' },
  { label: '玉子', tone: 'egg' },
  { label: '飲料', tone: 'tea' },
  { label: '鮭魚', tone: 'fish' },
  { label: '毛豆', tone: 'bean' },
  { label: '炸蝦', tone: 'shrimp' },
  { label: '番茄', tone: 'tomato' },
  { label: '海苔', tone: 'nori' },
]

const articleIngredients: Ingredient[] = [
  { label: '圖片', tone: 'fish' },
  { label: '標題', tone: 'rice' },
  { label: '日期', tone: 'tea' },
]

export const syntaxHints: Record<SyntaxKey, SyntaxHint> = {
  display: {
    label: 'display',
    description: '把外容器切換成 Flex 排版，裡面的 item 才會開始被排列。',
    values: ['flex'],
  },
  'justify-content': {
    label: 'justify-content',
    description: '控制 item 在主軸上的位置與間距。主軸方向會受到 flex-direction 影響。',
    values: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
  },
  'align-items': {
    label: 'align-items',
    description: '控制單行 item 在交錯軸上的對齊方式。',
    values: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'],
  },
  'flex-direction': {
    label: 'flex-direction',
    description: '決定主軸方向，也會改變 justify-content 和 align-items 看起來的效果。',
    values: ['row', 'row-reverse', 'column', 'column-reverse'],
  },
  'flex-wrap': {
    label: 'flex-wrap',
    description: '控制 item 放不下時是否換行。',
    values: ['nowrap', 'wrap'],
  },
}

export const levels: LevelPlan[] = [
  {
    id: 1,
    title: '啟動排版引擎',
    focus: '外容器和內元件',
    objective: '讓便當盒開始控制裡面的食材模組。',
    target: '啟動餐盒排版',
    scope: '.bento',
    syntax: ['display'],
    starterCss: `.bento {\n  \n}`,
    expected: [{ property: 'display', value: 'flex' }],
    ingredients: basicIngredients,
    successMessage: 'display: flex 加在外容器 .bento，裡面的食材模組開始被同一個容器控制。',
  },
  {
    id: 2,
    title: '選對餐盒',
    focus: 'Flex 要加在外容器',
    objective: '找出真正包住食材的那一層，讓排版指令下在正確位置。',
    target: '鎖定外容器',
    scope: '.bento',
    syntax: ['display'],
    starterCss: `.bento {\n  \n}\n\n.item {\n  \n}`,
    expected: [{ property: 'display', value: 'flex' }],
    forbidden: [
      {
        selector: '.item',
        property: 'display',
        value: 'flex',
        message: '這次要啟動的是餐盒本身。Flex 要加在外容器 .bento，不是內元件 .item。',
      },
    ],
    ingredients: basicIngredients,
    successMessage: '選對外容器了。.bento 控制裡面的 .item，不是反過來。',
  },
  {
    id: 3,
    title: '食材靠左歸位',
    focus: '主軸起點',
    objective: '把三個食材模組推到便當盒主軸起點。',
    target: '主軸起點',
    scope: '.bento',
    syntax: ['justify-content'],
    starterCss: `.bento {\n  display: flex;\n  justify-content: center;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'justify-content', value: 'flex-start' },
    ],
    ingredients: basicIngredients,
    successMessage: 'justify-content: flex-start 會把 item 對齊主軸起點。',
  },
  {
    id: 4,
    title: '主菜置中',
    focus: '主軸置中',
    objective: '把主菜模組集中到便當盒中間。',
    target: '主軸置中',
    scope: '.bento',
    syntax: ['justify-content'],
    starterCss: `.bento {\n  display: flex;\n  justify-content: flex-start;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'justify-content', value: 'center' },
    ],
    ingredients: basicIngredients,
    successMessage: 'justify-content: center 會讓 item 在主軸上置中。',
  },
  {
    id: 5,
    title: '飲料靠右停靠',
    focus: '主軸終點',
    objective: '把食材模組推到便當盒主軸終點。',
    target: '主軸終點',
    scope: '.bento',
    syntax: ['justify-content'],
    starterCss: `.bento {\n  display: flex;\n  justify-content: flex-start;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'justify-content', value: 'flex-end' },
    ],
    ingredients: basicIngredients,
    successMessage: 'justify-content: flex-end 會把 item 推到主軸終點。',
  },
  {
    id: 6,
    title: '三格配菜拉開',
    focus: '左右貼齊，中間平均',
    objective: '讓最外側食材貼近兩邊，中間距離平均分配。',
    target: '左右貼齊',
    scope: '.bento',
    syntax: ['justify-content'],
    starterCss: `.bento {\n  display: flex;\n  justify-content: center;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'justify-content', value: 'space-between' },
    ],
    ingredients: basicIngredients,
    successMessage: 'space-between 會讓兩側 item 貼近邊緣，中間空間平均分配。',
  },
  {
    id: 7,
    title: '每份食材都有空氣',
    focus: 'item 左右都有空間',
    objective: '讓每份食材模組左右都保留空間。',
    target: '保留周圍空間',
    scope: '.bento',
    syntax: ['justify-content'],
    starterCss: `.bento {\n  display: flex;\n  justify-content: center;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'justify-content', value: 'space-around' },
    ],
    ingredients: basicIngredients,
    successMessage: 'space-around 會讓每個 item 左右都有空間。',
  },
  {
    id: 8,
    title: '空間完全平均',
    focus: '所有空間平均',
    objective: '讓邊緣和食材之間的所有空間都平均。',
    target: '平均分配空間',
    scope: '.bento',
    syntax: ['justify-content'],
    starterCss: `.bento {\n  display: flex;\n  justify-content: center;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'justify-content', value: 'space-evenly' },
    ],
    ingredients: basicIngredients,
    successMessage: 'space-evenly 會讓所有間距都平均，包括邊緣和 item 之間。',
  },
  {
    id: 9,
    title: '食材貼齊上緣',
    focus: '交錯軸起點',
    objective: '把食材模組對齊到便當盒交錯軸起點。',
    target: '交錯軸起點',
    scope: '.bento',
    syntax: ['align-items'],
    starterCss: `.bento {\n  display: flex;\n  align-items: center;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'align-items', value: 'flex-start' },
    ],
    ingredients: basicIngredients,
    successMessage: 'align-items: flex-start 會把 item 對齊交錯軸起點。',
  },
  {
    id: 10,
    title: '食材垂直穩定',
    focus: '交錯軸置中',
    objective: '讓食材模組在交錯軸上置中。',
    target: '交錯軸置中',
    scope: '.bento',
    syntax: ['align-items'],
    starterCss: `.bento {\n  display: flex;\n  align-items: flex-start;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'align-items', value: 'center' },
    ],
    ingredients: basicIngredients,
    successMessage: 'align-items: center 會讓 item 在交錯軸上置中。',
  },
  {
    id: 11,
    title: '直式餐盒模式',
    focus: '改變主軸方向',
    objective: '把便當盒從橫向排列切換成直向堆疊。',
    target: '直向堆疊',
    scope: '.bento',
    syntax: ['flex-direction', 'justify-content', 'align-items'],
    starterCss: `.bento {\n  display: flex;\n  flex-direction: row;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'flex-direction', value: 'column' },
    ],
    ingredients: basicIngredients,
    successMessage: 'flex-direction: column 會把主軸改成由上到下。',
  },
  {
    id: 12,
    title: '派對餐盒換行',
    focus: '放不下時換行',
    objective: '讓太多食材模組放不下時自動換到下一排。',
    target: '自動換行',
    scope: '.bento',
    syntax: ['flex-wrap'],
    starterCss: `.bento {\n  display: flex;\n  flex-wrap: nowrap;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'flex-wrap', value: 'wrap' },
    ],
    ingredients: partyIngredients,
    successMessage: 'flex-wrap: wrap 會讓 item 放不下時換到下一排。',
  },
  {
    id: 13,
    title: '橫向反轉輸送帶',
    focus: '主軸方向反轉',
    objective: '把食材從右往左重新排序。',
    target: 'row-reverse',
    scope: '.bento',
    syntax: ['flex-direction'],
    starterCss: `.bento {\n  display: flex;\n  flex-direction: row;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'flex-direction', value: 'row-reverse' },
    ],
    ingredients: basicIngredients,
    successMessage: 'flex-direction: row-reverse 會讓主軸維持橫向，但排列方向從右往左。',
  },
  {
    id: 14,
    title: '直向反轉餐盒',
    focus: '直向方向反轉',
    objective: '把食材改成由下往上堆疊。',
    target: 'column-reverse',
    scope: '.bento',
    syntax: ['flex-direction'],
    starterCss: `.bento {\n  display: flex;\n  flex-direction: column;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'flex-direction', value: 'column-reverse' },
    ],
    ingredients: basicIngredients,
    successMessage: 'flex-direction: column-reverse 會讓主軸改成由下往上。',
  },
  {
    id: 15,
    title: '直式餐盒靠下',
    focus: 'column 下的主軸終點',
    objective: '主軸改成直向後，把食材推到下方。',
    target: '直向主軸終點',
    scope: '.bento',
    syntax: ['flex-direction', 'justify-content'],
    starterCss: `.bento {\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-start;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'flex-direction', value: 'column' },
      { property: 'justify-content', value: 'flex-end' },
    ],
    ingredients: basicIngredients,
    successMessage: '主軸是 column 時，justify-content: flex-end 會把 item 推到下方。',
  },
  {
    id: 16,
    title: '直式餐盒置中',
    focus: 'column 下的主軸置中',
    objective: '主軸改成直向後，把食材放到上下中間。',
    target: '直向主軸置中',
    scope: '.bento',
    syntax: ['flex-direction', 'justify-content'],
    starterCss: `.bento {\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-start;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'flex-direction', value: 'column' },
      { property: 'justify-content', value: 'center' },
    ],
    ingredients: basicIngredients,
    successMessage: '主軸是 column 時，justify-content: center 會讓 item 上下置中。',
  },
  {
    id: 17,
    title: '直式餐盒左右置中',
    focus: 'column 下的交錯軸',
    objective: '主軸改成直向後，把食材放到左右中間。',
    target: '直向交錯軸置中',
    scope: '.bento',
    syntax: ['flex-direction', 'align-items'],
    starterCss: `.bento {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'flex-direction', value: 'column' },
      { property: 'align-items', value: 'center' },
    ],
    ingredients: basicIngredients,
    successMessage: '主軸是 column 時，align-items: center 會讓 item 左右置中。',
  },
  {
    id: 18,
    title: '便當盒正中央',
    focus: '水平與垂直置中',
    objective: '把食材放到便當盒正中央。',
    target: '主軸與交錯軸置中',
    scope: '.bento',
    syntax: ['justify-content', 'align-items'],
    starterCss: `.bento {\n  display: flex;\n  justify-content: flex-start;\n  align-items: flex-start;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'justify-content', value: 'center' },
      { property: 'align-items', value: 'center' },
    ],
    ingredients: basicIngredients,
    successMessage: 'justify-content: center 加上 align-items: center，就能做水平與垂直置中。',
  },
  {
    id: 19,
    title: '食材貼齊下緣',
    focus: '交錯軸終點',
    objective: '把食材模組對齊到便當盒交錯軸終點。',
    target: '交錯軸終點',
    scope: '.bento',
    syntax: ['align-items'],
    starterCss: `.bento {\n  display: flex;\n  align-items: flex-start;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'align-items', value: 'flex-end' },
    ],
    ingredients: basicIngredients,
    successMessage: 'align-items: flex-end 會把 item 對齊交錯軸終點。',
  },
  {
    id: 20,
    title: '撐滿餐盒高度',
    focus: 'stretch 預設效果',
    objective: '讓食材模組沿著交錯軸撐滿可用空間。',
    target: '交錯軸撐滿',
    scope: '.bento',
    syntax: ['align-items'],
    starterCss: `.bento {\n  display: flex;\n  align-items: flex-start;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'align-items', value: 'stretch' },
    ],
    ingredients: basicIngredients,
    successMessage: 'align-items: stretch 會讓沒有固定交錯軸尺寸的 item 撐滿容器。',
  },
  {
    id: 21,
    title: '文字基準線對齊',
    focus: 'baseline',
    objective: '讓不同大小的文字沿著同一條基準線對齊。',
    target: '文字基準線',
    scope: '.bento',
    syntax: ['align-items'],
    starterCss: `.bento {\n  display: flex;\n  align-items: flex-start;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'align-items', value: 'baseline' },
    ],
    ingredients: basicIngredients,
    successMessage: 'align-items: baseline 會依文字基準線對齊 item。',
  },
  {
    id: 22,
    title: '換行後置中',
    focus: 'wrap 與主軸置中',
    objective: '食材太多時先換行，再讓每一行往主軸中間靠。',
    target: '換行置中',
    scope: '.bento',
    syntax: ['flex-wrap', 'justify-content'],
    starterCss: `.bento {\n  display: flex;\n  flex-wrap: nowrap;\n  justify-content: flex-start;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'flex-wrap', value: 'wrap' },
      { property: 'justify-content', value: 'center' },
    ],
    ingredients: partyIngredients,
    successMessage: 'flex-wrap: wrap 搭配 justify-content: center，可以讓換行後的 item 仍靠主軸中間。',
  },
  {
    id: 23,
    title: '派對餐盒平均分散',
    focus: 'wrap 與 space-between',
    objective: '食材換行後，讓每一行的左右邊界拉開。',
    target: '換行後左右貼齊',
    scope: '.bento',
    syntax: ['flex-wrap', 'justify-content'],
    starterCss: `.bento {\n  display: flex;\n  flex-wrap: nowrap;\n  justify-content: center;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'flex-wrap', value: 'wrap' },
      { property: 'justify-content', value: 'space-between' },
    ],
    ingredients: partyIngredients,
    successMessage: '換行後仍然可以用 justify-content 控制每一行在主軸上的分配。',
  },
  {
    id: 24,
    title: '文章卡片左右排',
    focus: '作業版型：圖片左、文字右',
    objective: '把文章卡片裡的圖片和資訊改成左右排列。',
    target: '卡片左右排列',
    scope: '.bento',
    syntax: ['display', 'flex-direction'],
    starterCss: `.bento {\n  display: flex;\n  flex-direction: column;\n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { property: 'flex-direction', value: 'row' },
    ],
    ingredients: articleIngredients,
    successMessage: '文章卡片常用 display: flex 和 flex-direction: row 做出圖片左、文字右。',
  },
  {
    id: 25,
    title: 'Flex 裡再包 Flex',
    focus: '同一元素也可以當外容器',
    objective: '讓每個 .item 自己也能排內部內容。',
    target: 'item 也啟動 Flex',
    scope: '.item',
    syntax: ['display', 'justify-content', 'align-items'],
    starterCss: `.bento {\n  display: flex;\n}\n\n.item {\n  \n}`,
    expected: [
      { property: 'display', value: 'flex' },
      { selector: '.item', property: 'display', value: 'flex' },
      { selector: '.item', property: 'justify-content', value: 'center' },
      { selector: '.item', property: 'align-items', value: 'center' },
    ],
    ingredients: articleIngredients,
    successMessage: '.item 先被 .bento 排版，同時也能用 display: flex 排自己的內部內容。',
  },
]
