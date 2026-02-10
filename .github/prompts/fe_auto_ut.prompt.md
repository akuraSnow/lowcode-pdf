## INSTRUCTION MODE
Using @sequentialthinking and @content7_mcp throughout this task.
Analyze thoroughly then proceed in clear sequential steps without asking for confirmation.

## PROJECT CONTEXT
- Project Type: React
- Testing Framework: Jest + React Testing Library (default) OR Vitest (if vitest configured)

## CODING STANDARDS
### React:
- Folders/files: lowercase with hyphens (kebab-case)
- Components: PascalCase (ComponentName.tsx)
- Hooks: useXxx pattern
- Variables/Functions: camelCase
- Test files: ComponentName.test.tsx or component-name.test.tsx
- Use React Testing Library best practices (query by accessibility)

### Universal Standards:
- Keep files/logic/functions small and focused (Single Responsibility)
- Use modular CSS/SCSS (or Tailwind + classnames for React)
- Always define TypeScript types for APIs and props
- Follow unified naming: English only, no Pinyin/mixed languages
- Comprehensive error handling in tests
- Test both happy path and edge cases

## EXECUTION PLAN
1. **Environment Setup**: Verify testing dependencies and install if missing
2. **Project Analysis**: 
   - Scan for all testable files (components, services, hooks, utilities)
   - Identify existing test files and coverage gaps
   - Prioritize by business importance and complexity
3. **Test File Generation**: 
   - Create missing test files with proper naming conventions
   - Generate comprehensive test suites for each file type
4. **Coverage Analysis**: 
   - Run initial test suite and collect coverage report
   - Identify files below 80% coverage threshold
5. **Coverage Optimization**: 
   - Enhance existing tests for better coverage
   - Add edge case tests for complex logic
   - Mock external dependencies properly
6. **Quality Assurance**: 
   - Verify all tests pass
   - Check test performance and reliability
   - Ensure proper cleanup and teardown
7. **Final Report**: Generate comprehensive coverage and quality report

## TEST STRATEGY

### Component Testing (Priority 1):
- **Rendering**: Verify component renders without errors
- **Props/Inputs**: Test all prop combinations and default values
- **Events**: Test user interactions (click, input, form submission)
- **State Changes**: Verify state updates and side effects
- **Conditional Rendering**: Test different UI states
- **Accessibility**: Verify ARIA attributes and keyboard navigation

### Service/API Testing (Priority 1):
- **Method Behavior**: Test all public methods with various inputs
- **HTTP Interactions**: Mock API calls and test error handling
- **State Management**: Test data flow and state mutations
- **Error Scenarios**: Network failures, invalid responses
- **Authentication**: Token handling, refresh logic

### Hook Testing (Priority 2):
- **Initialization**: Test initial state and setup
- **State Updates**: Test state changes and side effects
- **Cleanup**: Test unmounting and memory leak prevention
- **Dependencies**: Test effect dependencies and re-renders

### Utility Function Testing (Priority 3):
- **Input/Output**: Test with various input types and edge cases
- **Error Handling**: Invalid inputs, boundary conditions
- **Performance**: Test with large datasets if applicable
- **Pure Functions**: Verify no side effects

## COVERAGE TARGETS
- **Minimum Threshold**: 80% overall coverage
- **Critical Business Logic**: 95%+ coverage
- **Components**: 85%+ coverage  
- **Services/APIs**: 90%+ coverage
- **Utilities**: 95%+ coverage
- **Line Coverage**: Primary metric
- **Branch Coverage**: Secondary metric (minimum 75%)

## AUTONOMOUS MODE CONFIGURATION
### Auto-Execution Rules:
- Install missing dependencies without confirmation
- Create test files following project conventions
- Run tests and collect coverage automatically
- Optimize tests iteratively until targets are met
- Generate final reports in markdown format

### Progress Reporting:
- Report at start of each major phase
- Show coverage improvements after each iteration
- Alert on any test failures or issues
- Provide final summary with metrics

### Exit Conditions:
- All target files reach minimum 80% coverage
- All tests pass successfully
- No critical business logic remains untested
- Performance benchmarks are met

## ERROR HANDLING
- **Dependency Issues**: Auto-install or provide clear installation commands
- **Compilation Errors**: Fix common TypeScript/syntax issues
- **Test Failures**: Debug and fix failing tests before proceeding
- **Coverage Gaps**: Identify and address untested code paths
- **Performance Issues**: Optimize slow-running tests

## QUALITY GATES
- [ ] All tests must pass
- [ ] No test files with less than 80% coverage
- [ ] No flaky or unreliable tests
- [ ] Proper mocking of external dependencies
- [ ] Accessibility testing included where applicable
- [ ] Performance regression tests for critical paths

BEGIN TASK: Analyze the project structure, automatically install dependencies, create comprehensive test files, optimize for 80%+ coverage, and provide a detailed final report with metrics and recommendations.