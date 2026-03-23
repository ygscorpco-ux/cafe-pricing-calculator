import type {
  CategoryKey,
  FieldDefinition,
  FixedCostInputs,
  LaborInputs,
  LossInputs,
  SalesInputs,
  TemplateDefinition,
  VariableCostInputs,
} from "@/lib/types";

export const VAT_RATE = 0.1;
export const STORAGE_VERSION = "v2";
export const DEFAULT_TARGET_MONTHLY_NET_PROFIT = 20_000_000;
export const GOAL_THRESHOLDS = {
  achievable: 0.07,
  stretch: 0.15,
};

export const CATEGORY_META: Record<
  CategoryKey,
  {
    label: string;
    description: string;
    locked?: boolean;
    allowBundle?: boolean;
  }
> = {
  sales: {
    label: "A. 매출 기준",
    description: "월/연 매출, 객단가, 방문객, 카드/포장 비율 같은 기준값입니다.",
    locked: true,
  },
  menuSpec: {
    label: "B. 메뉴 스펙",
    description: "메뉴별 컵 용량, 샷 수, 우유/시럽/청 사용량은 중앙 표에서 바로 조정합니다.",
    locked: true,
  },
  ingredients: {
    label: "C. 직접 원재료비",
    description: "원두, 우유, 시럽, 청 등 직접 재료의 기준 단가입니다.",
  },
  packaging: {
    label: "D. 포장재",
    description: "컵, 뚜껑, 빨대, 홀더, 캐리어 등 포장 단가를 관리합니다.",
  },
  variableCosts: {
    label: "E. 변동비",
    description: "카드수수료, 정산비용, 플랫폼 수수료, 할인비를 반영합니다.",
  },
  labor: {
    label: "F. 인건비",
    description: "급여와 4대보험, 퇴직충당금, 복리후생을 월 기준으로 반영합니다.",
    allowBundle: true,
  },
  fixedCosts: {
    label: "G. 고정비",
    description: "월세, 관리비, 공과금, 기타 운영비를 반영합니다.",
    allowBundle: true,
  },
  loss: {
    label: "H. 로스/폐기",
    description: "폐기율, 재제조, 무료 제공 같은 손실을 일괄 또는 세부로 잡습니다.",
    allowBundle: true,
  },
  tax: {
    label: "I. 세금/가격 구조",
    description: "부가세 포함/별도, 공급가 역산, 목표 순이익 기준 추천가를 관리합니다.",
    locked: true,
  },
};

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "basic-cafe",
    name: "기본 카페형",
    tone: "균형형",
    description: "일반적인 동네 카페를 기준으로 한 기본 구조입니다.",
  },
  {
    id: "takeout",
    name: "테이크아웃형",
    tone: "회전형",
    description: "포장 비중이 높고 회전이 빠른 매장을 가정합니다.",
  },
  {
    id: "mid-range",
    name: "중가형",
    tone: "표준 상향",
    description: "조금 더 높은 객단가와 안정적인 마진을 목표로 합니다.",
  },
  {
    id: "premium",
    name: "프리미엄형",
    tone: "고마진형",
    description: "재료와 공간비가 높고 판매가도 높은 매장을 가정합니다.",
  },
];

export const SALES_FIELDS: FieldDefinition<keyof SalesInputs>[] = [
  {
    key: "monthlySales",
    label: "월매출",
    kind: "currency",
    description: "직접 입력하면 다른 보조 지표보다 우선해서 계산합니다.",
  },
  {
    key: "annualSales",
    label: "연매출",
    kind: "currency",
    description: "연 기준으로 잡고 싶을 때 입력합니다.",
  },
  {
    key: "averageTicket",
    label: "객단가",
    kind: "currency",
    description: "매출이 비어 있으면 객단가 x 방문객으로 월매출을 추정합니다.",
  },
  {
    key: "visitorsPerDay",
    label: "일평균 방문객",
    kind: "number",
    unitLabel: "명",
  },
  {
    key: "operatingDaysPerMonth",
    label: "월 영업일수",
    kind: "number",
    unitLabel: "일",
  },
  {
    key: "cardRatio",
    label: "카드 비중",
    kind: "percent",
    description: "카드 수수료 계산에 사용됩니다.",
  },
  {
    key: "takeoutRatio",
    label: "포장 비중",
    kind: "percent",
    description: "포장재와 일부 플랫폼 비용 계산에 사용됩니다.",
  },
];

export const VARIABLE_COST_FIELDS: FieldDefinition<keyof VariableCostInputs>[] = [
  {
    key: "cardFeeRate",
    label: "카드수수료",
    kind: "percent",
    description: "카드 결제 비중에만 반영됩니다.",
  },
  {
    key: "settlementFeeRate",
    label: "PG/VAN/정산 비용",
    kind: "percent",
  },
  {
    key: "platformFeeRate",
    label: "플랫폼 수수료",
    kind: "percent",
  },
  {
    key: "loyaltyDiscountRate",
    label: "할인/적립 비용",
    kind: "percent",
  },
  {
    key: "orderFixedCost",
    label: "주문당 고정 변동비",
    kind: "currency",
    description: "포장 비중이 높을수록 더 많이 반영됩니다.",
  },
];

export const LABOR_FIELDS: FieldDefinition<keyof LaborInputs>[] = [
  {
    key: "salariedPayroll",
    label: "정직원 급여",
    kind: "currency",
  },
  {
    key: "partTimeMonthlyPayroll",
    label: "알바 월급 묶음",
    kind: "currency",
    description: "간단 모드에서 사용합니다.",
  },
  {
    key: "partTimeHourlyWage",
    label: "알바 시급",
    kind: "currency",
    advanced: true,
  },
  {
    key: "partTimeShiftCount",
    label: "근무횟수",
    kind: "number",
    advanced: true,
    unitLabel: "회",
  },
  {
    key: "partTimeHoursPerShift",
    label: "근무시간",
    kind: "number",
    advanced: true,
    unitLabel: "시간",
  },
  {
    key: "employerInsuranceRate",
    label: "4대보험 사업주 부담",
    kind: "percent",
  },
  {
    key: "retirementReserveRate",
    label: "퇴직충당금",
    kind: "percent",
  },
  {
    key: "welfareCost",
    label: "식대/복리후생",
    kind: "currency",
  },
];

export const FIXED_COST_FIELDS: FieldDefinition<keyof FixedCostInputs>[] = [
  { key: "monthlyRent", label: "월세", kind: "currency" },
  { key: "maintenanceFee", label: "관리비", kind: "currency" },
  { key: "utilitiesBundle", label: "공과금 묶음", kind: "currency" },
  { key: "operationsBundle", label: "기타 운영비 묶음", kind: "currency" },
  { key: "suppliesBundle", label: "기타 소모품 묶음", kind: "currency" },
  { key: "repairCost", label: "수선비", kind: "currency", advanced: true },
  {
    key: "professionalServices",
    label: "세무/법무/노무",
    kind: "currency",
    advanced: true,
  },
  { key: "insuranceFee", label: "보험료", kind: "currency", advanced: true },
  { key: "marketingCost", label: "마케팅비", kind: "currency", advanced: true },
  {
    key: "cleaningWasteLaundry",
    label: "청소/방역/세탁/쓰레기 처리",
    kind: "currency",
    advanced: true,
  },
  {
    key: "telecomMusicCctv",
    label: "인터넷/전화/CCTV/음원",
    kind: "currency",
    advanced: true,
  },
  { key: "posKiosk", label: "POS/키오스크", kind: "currency", advanced: true },
  {
    key: "equipmentLeaseDepreciation",
    label: "장비 감가상각/리스",
    kind: "currency",
    advanced: true,
  },
  {
    key: "waterFilterCleaning",
    label: "정수필터/연수기/세정제",
    kind: "currency",
    advanced: true,
  },
];

export const LOSS_FIELDS: FieldDefinition<keyof LossInputs>[] = [
  {
    key: "totalLossRate",
    label: "로스율 일괄 반영",
    kind: "percent",
    description: "간단 모드에서 직접원가·포장원가·변동비에 한 번에 반영합니다.",
  },
  {
    key: "ingredientWasteRate",
    label: "식재료 폐기율",
    kind: "percent",
    advanced: true,
  },
  {
    key: "packagingLossRate",
    label: "포장재 손실",
    kind: "percent",
    advanced: true,
  },
  { key: "remakeRate", label: "재제조율", kind: "percent", advanced: true },
  {
    key: "freeDrinkRate",
    label: "무료 제공/서비스 음료",
    kind: "percent",
    advanced: true,
  },
  { key: "failureRate", label: "제조 실패율", kind: "percent", advanced: true },
];
