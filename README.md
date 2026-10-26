# 전자세금계산서 XML 보기

전자세금계산서·전자계산서 XML 파일을 홈택스 인쇄본과 같은 배치의 서식으로 보여 주고, 인쇄·PDF·HTML로 저장하는 무료 웹 도구입니다.

**https://taxinvoice.yuujin.kim**

- 설치·가입 없이 브라우저에서 바로 씁니다. 여러 파일을 한 번에 열 수 있습니다.
- `인쇄 · PDF`: 계산서 한 건이 A4 한 쪽. PDF는 인쇄 창에서 ‘PDF로 저장’을 고릅니다.
- `HTML 저장`: 열린 계산서를 스크립트 없는 HTML 한 파일로 내려받습니다.
- 품목 합계·합계금액·결제수단 금액이 서로 맞지 않으면 화면에 검산 경고를 보입니다(인쇄되지 않음).

## 개인정보

파일은 브라우저 안에서만 읽고 어디로도 보내지 않습니다. 서버에는 HTML 파일 하나뿐이며, 응답 헤더의 Content-Security-Policy(`connect-src 'none'`, `default-src 'none'`)가 페이지의 외부 통신 자체를 막습니다([`public/_headers`](public/_headers)). 광고·분석 스크립트는 없습니다.

인터넷 없이 쓰려면 [`public/index.html`](public/index.html)을 내려받아 더블클릭하면 됩니다.

## 해석 범위

국세청 전자(세금)계산서 표준 XML(`urn:kr:or:kec:standard:Tax:ReusableAggregateBusinessInformationEntitySchemaModule:1:0`)을 읽습니다.

| 서식 항목 | XML 위치 |
|---|---|
| 종류 | `TaxInvoiceDocument/TypeCode` 앞 2자리(01 세금계산서·02 수정세금계산서·03 계산서·04 수정계산서), 뒤 2자리(영세율·위수탁·수입 등) |
| 승인번호 | `TaxInvoiceDocument/IssueID` (8-8-8로 표시) |
| 작성일자·비고·수정사유 | `IssueDateTime`, `DescriptionText`, `AmendmentStatusCode`; `OriginalIssueID`는 비고에 ‘당초 승인번호’로 표시 |
| 공급자·공급받는자·수탁자 | `InvoicerParty`·`InvoiceeParty`·`BrokerParty` |
| 품목 | `TaxInvoiceTradeLineItem` |
| 합계·결제 | `SpecifiedMonetarySummation`, `SpecifiedPaymentMeans`(10 현금·20 수표·30 어음·40 외상미수금), `PurposeCode`(01 영수·02 청구) |

- 계산서(면세)는 세액 열을 뺍니다. 공급받는자가 주민등록번호면 뒷자리를 가립니다.
- XML 선언의 인코딩(UTF-8·EUC-KR 등)을 따릅니다.
- 전자서명은 검증하지 않습니다. 발급 사실은 국세청 홈택스 「조회/발급 › 전자세금계산서 › 제3자 발급사실 조회」에서 확인하세요.

이 도구는 국세청·홈택스와 관계없는 개인 프로젝트입니다. 해석 오류나 기능 제안은 [Issues](https://github.com/kimyuujin/tax-invoice-viewer/issues)에 남겨 주세요. 실제 계산서 파일은 올리지 마세요.

## 개발

```bash
npm install
npx playwright install chromium
npm test                                   # public/index.html 검사
node tests/smoke.cjs https://taxinvoice.yuujin.kim   # 배포본 검사
npm run deploy                             # Cloudflare Workers 정적 배포
```

`tests/fixtures/`의 XML은 모두 가상 데이터입니다.

## 라이선스

MIT
