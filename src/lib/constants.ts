import type {
  CategoryKey,
  FieldDefinition,
  FixedCostInputs,
  LaborInputs,
  LossInputs,
  PricingStrategy,
  SalesInputs,
  TemplateDefinition,
  VariableCostInputs,
} from "@/lib/types";

export const VAT_RATE = 0.1;
export const STORAGE_VERSION = "v4";
export const DEFAULT_TARGET_MONTHLY_NET_PROFIT = 7_500_000;
export const DEFAULT_TARGET_INGREDIENT_RATE = 0.3;
export const RECOMMENDED_INGREDIENT_RATE_RANGE = {
  min: 0.28,
  max: 0.32,
};
export const GOAL_THRESHOLDS = {
  achievable: 0.07,
  stretch: 0.15,
};

export const PRICING_STRATEGY_OPTIONS: Array<{
  value: PricingStrategy;
  label: string;
  description: string;
}> = [
  {
    value: "conservative",
    label: "보수적",
    description: "원재료율을 조금 높게 잡고, 가격 인상 폭을 완만하게 봅니다.",
  },
  {
    value: "default",
    label: "기본",
    description: "대부분의 일반 카페가 쓰기 좋은 균형형 기준입니다.",
  },
  {
    value: "aggressive",
    label: "공격적",
    description: "가격 경쟁보다 순이익 확보를 우선으로 보는 기준입니다.",
  },
];

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
    label: "기본 매출 입력",
    description: "월매출, 객단가, 방문객 수처럼 계산의 출발점이 되는 값입니다.",
    locked: true,
  },
  menuSpec: {
    label: "메뉴 스펙",
    description: "메뉴별 판매 비중과 레시피 구조를 관리합니다.",
    locked: true,
  },
  ingredients: {
    label: "원재료 단가",
    description: "원두, 우유, 시럽, 청처럼 직접 들어가는 재료 단가입니다.",
  },
  packaging: {
    label: "포장재 단가",
    description: "컵, 뚜껑, 빨대, 홀더처럼 포장에 들어가는 비용입니다.",
  },
  variableCosts: {
    label: "변동비",
    description: "카드 수수료, 정산 비용, 플랫폼 비용처럼 주문마다 붙는 비용입니다.",
  },
  labor: {
    label: "인건비",
    description: "급여, 4대보험, 퇴직충당금, 복리후생을 포함합니다.",
    allowBundle: true,
  },
  fixedCosts: {
    label: "고정비",
    description: "월세, 공과금, 운영비 같은 월 단위 비용입니다.",
    allowBundle: true,
  },
  loss: {
    label: "로스 / 폐기",
    description: "식재료 폐기, 재제조, 무료 제공처럼 새는 비용입니다.",
    allowBundle: true,
  },
  tax: {
    label: "고급 가격 기준",
    description: "부가세와 원재료율 같은 가격 계산 기준입니다.",
    locked: true,
  },
};

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "standard",
    name: "기본값",
    tone: "neutral",
    description: "초기 시드 데이터용 기본 템플릿입니다.",
  },
];

export const SALES_FIELDS: FieldDefinition<keyof SalesInputs>[] = [
  {
    key: "monthlySales",
    label: "월매출",
    kind: "currency",
    description: "가장 우선으로 보는 핵심 입력값입니다.",
  },
  {
    key: "annualSales",
    label: "연매출",
    kind: "currency",
    description: "연 기준으로 생각할 때만 쓰는 보조 입력값입니다.",
  },
  {
    key: "averageTicket",
    label: "객단가",
    kind: "currency",
    description: "고객 1명이 평균 얼마를 쓰는지 보여주는 값입니다.",
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
    description: "카드 수수료 계산에 바로 쓰는 값입니다.",
  },
  {
    key: "takeoutRatio",
    label: "포장 비중",
    kind: "percent",
    description: "포장재와 플랫폼 비용 계산에 반영됩니다.",
  },
];

export const VARIABLE_COST_FIELDS: FieldDefinition<keyof VariableCostInputs>[] = [
  {
    key: "cardFeeRate",
    label: "카드 수수료",
    kind: "percent",
  },
  {
    key: "settlementFeeRate",
    label: "PG / VAN / 정산 비용",
    kind: "percent",
  },
  {
    key: "platformFeeRate",
    label: "플랫폼 수수료",
    kind: "percent",
  },
  {
    key: "loyaltyDiscountRate",
    label: "할인 / 적립 비용",
    kind: "percent",
  },
  {
    key: "orderFixedCost",
    label: "주문당 고정 변동비",
    kind: "currency",
    description: "포장 주문이 늘수록 함께 붙는 고정성 변동비입니다.",
  },
];

export const LABOR_FIELDS: FieldDefinition<keyof LaborInputs>[] = [
  { key: "salariedPayroll", label: "정직원 급여", kind: "currency" },
  {
    key: "partTimeMonthlyPayroll",
    label: "알바 인건비 묶음",
    kind: "currency",
    description: "간단 입력 모드에서 쓰는 월 인건비 묶음입니다.",
  },
  { key: "partTimeHourlyWage", label: "알바 시급", kind: "currency", advanced: true },
  { key: "partTimeShiftCount", label: "근무 횟수", kind: "number", unitLabel: "회", advanced: true },
  { key: "partTimeHoursPerShift", label: "근무 시간", kind: "number", unitLabel: "시간", advanced: true },
  { key: "employerInsuranceRate", label: "4대보험 사업주 부담", kind: "percent" },
  { key: "retirementReserveRate", label: "퇴직충당금", kind: "percent" },
  { key: "welfareCost", label: "식대 / 복리후생", kind: "currency" },
];

export const FIXED_COST_FIELDS: FieldDefinition<keyof FixedCostInputs>[] = [
  { key: "monthlyRent", label: "월세", kind: "currency" },
  { key: "maintenanceFee", label: "관리비", kind: "currency" },
  { key: "utilitiesBundle", label: "공과금 묶음", kind: "currency" },
  { key: "operationsBundle", label: "기타 운영비 묶음", kind: "currency" },
  { key: "suppliesBundle", label: "기타 소모품 묶음", kind: "currency" },
  { key: "repairCost", label: "수선비", kind: "currency", advanced: true },
  { key: "professionalServices", label: "세무 / 법무 / 노무", kind: "currency", advanced: true },
  { key: "insuranceFee", label: "보험료", kind: "currency", advanced: true },
  { key: "marketingCost", label: "마케팅비", kind: "currency", advanced: true },
  {
    key: "cleaningWasteLaundry",
    label: "청소 / 방역 / 세탁 / 쓰레기 처리",
    kind: "currency",
    advanced: true,
  },
  {
    key: "telecomMusicCctv",
    label: "인터넷 / 전화 / CCTV / 음원 사용료",
    kind: "currency",
    advanced: true,
  },
  { key: "posKiosk", label: "POS / 키오스크", kind: "currency", advanced: true },
  {
    key: "equipmentLeaseDepreciation",
    label: "장비 감가상각 / 리스",
    kind: "currency",
    advanced: true,
  },
  {
    key: "waterFilterCleaning",
    label: "정수필터 / 세정제 / 연수기",
    kind: "currency",
    advanced: true,
  },
];

export const LOSS_FIELDS: FieldDefinition<keyof LossInputs>[] = [
  {
    key: "totalLossRate",
    label: "로스율 일괄 반영",
    kind: "percent",
    description: "간단 모드에서 전체 로스율을 한 번에 반영합니다.",
  },
  { key: "ingredientWasteRate", label: "식재료 폐기율", kind: "percent", advanced: true },
  { key: "packagingLossRate", label: "포장재 손실", kind: "percent", advanced: true },
  { key: "remakeRate", label: "재제조율", kind: "percent", advanced: true },
  { key: "freeDrinkRate", label: "무료 제공 / 서비스 음료", kind: "percent", advanced: true },
  { key: "failureRate", label: "제조 실패율", kind: "percent", advanced: true },
];
