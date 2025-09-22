# Tasks: Add Delete Option for Events

**Input**: Design documents from `/specs/002-add-delete-option/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: React + TypeScript, Firebase, Tailwind CSS, Jest
2. Load optional design documents:
   → data-model.md: Event entity validation logic
   → contracts/: cancel-event-api.json → contract test
   → research.md: Soft delete implementation decisions
   → quickstart.md: User journey test scenarios
3. Generate tasks by category:
   → Setup: verify existing project structure
   → Tests: contract tests, integration tests for user flows
   → Core: UI components, service integration
   → Integration: error handling, navigation
   → Polish: unit tests, validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → Contract has test? Yes
   → User stories have integration tests? Yes
   → All endpoints implemented? Yes (using existing cancelEvent)
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `frontend/src/` for React components and services
- **Tests**: `frontend/tests/` for Jest test files
- **Types**: `frontend/src/types/` for TypeScript interfaces

## Phase 3.1: Setup
- [ ] T001 Verify existing project structure matches plan.md requirements
- [ ] T002 Confirm Firebase and React dependencies are installed
- [ ] T003 [P] Verify linting and testing tools are configured

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test for cancel-event-api.json in frontend/tests/contract/test_cancel_event.contract.test.ts
- [ ] T005 [P] Integration test for successful event cancellation in frontend/tests/integration/test_event_cancellation.integration.test.tsx
- [ ] T006 [P] Integration test for permission denied scenarios in frontend/tests/integration/test_event_cancellation_permissions.integration.test.tsx
- [ ] T007 [P] Integration test for edge cases (already cancelled/completed) in frontend/tests/integration/test_event_cancellation_edge_cases.integration.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T008 Add delete button to EditEventPage component in frontend/src/pages/EditEventPage.tsx
- [ ] T009 Create confirmation dialog components in frontend/src/components/events/EventDeleteDialog.tsx
- [ ] T010 Implement delete permission validation logic in frontend/src/services/eventService.ts
- [ ] T011 Add delete event handler to EditEventPage in frontend/src/pages/EditEventPage.tsx
- [ ] T012 Integrate cancelEvent API call in delete handler in frontend/src/pages/EditEventPage.tsx

## Phase 3.4: Integration
- [ ] T013 Add error handling for delete operations in frontend/src/pages/EditEventPage.tsx
- [ ] T014 Implement navigation after successful deletion in frontend/src/pages/EditEventPage.tsx
- [ ] T015 Add loading states for delete operations in frontend/src/pages/EditEventPage.tsx
- [ ] T016 Update event status validation in edit page load in frontend/src/pages/EditEventPage.tsx

## Phase 3.5: Polish
- [ ] T017 [P] Unit tests for delete permission validation in frontend/tests/unit/test_event_permissions.unit.test.ts
- [ ] T018 [P] Unit tests for delete dialog components in frontend/tests/unit/components/test_EventDeleteDialog.unit.test.tsx
- [ ] T019 Performance validation (<2s cancellation time)
- [ ] T020 Mobile responsiveness validation for delete UI
- [ ] T021 Update component documentation
- [ ] T022 Run quickstart validation checklist

## Dependencies
- Tests (T004-T007) before implementation (T008-T016)
- T008 blocks T011, T013-T015 (all modify EditEventPage.tsx)
- T009 blocks T018 (EventDeleteDialog unit tests)
- T010 blocks T017 (permission validation unit tests)
- Implementation before polish (T017-T022)

## Parallel Execution Examples
```
# Launch T004-T007 together (all test files are independent):
Task: "Contract test for cancel-event-api.json in frontend/tests/contract/test_cancel_event.contract.test.ts"
Task: "Integration test for successful event cancellation in frontend/tests/integration/test_event_cancellation.integration.test.tsx"
Task: "Integration test for permission denied scenarios in frontend/tests/integration/test_event_cancellation_permissions.integration.test.tsx"
Task: "Integration test for edge cases in frontend/tests/integration/test_event_cancellation_edge_cases.integration.test.tsx"

# Launch T017-T018 together (different test files):
Task: "Unit tests for delete permission validation in frontend/tests/unit/test_event_permissions.unit.test.ts"
Task: "Unit tests for delete dialog components in frontend/tests/unit/components/test_EventDeleteDialog.unit.test.tsx"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (TDD requirement)
- Commit after each task completion
- Avoid: vague tasks, same file conflicts
- Existing cancelEvent() function in eventService.ts will be reused

## Task Generation Rules Applied
*Applied during main() execution*

1. **From Contracts**:
   - cancel-event-api.json → T004 contract test [P]

2. **From Data Model**:
   - Event entity validation → T010 permission validation
   - Status transitions → T016 status validation

3. **From User Stories**:
   - Happy path cancellation → T005 integration test [P]
   - Permission denied → T006 integration test [P]
   - Edge cases → T007 integration test [P]

4. **From Research**:
   - Soft delete decision → reuse existing cancelEvent function
   - UI placement → T008 delete button in EditEventPage

5. **Ordering**:
   - Setup → Tests → Core UI → Integration → Polish
   - EditEventPage.tsx modifications are sequential (T008, T011-T016)

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T004)
- [x] All user stories have integration tests (T005-T007)
- [x] All tests come before implementation (T004-T007 before T008-T016)
- [x] Parallel tasks truly independent (different test files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Dependencies properly mapped (EditEventPage sequential tasks)