# 🐛 Known Bugs & Issues

## Critical UI Bugs

### Incident Modal State Persistence Bug
**Status:** Open - CLAR-72
**Priority:** High
**Affects:** Incident list modal functionality

**Description:**
When clicking "ver más" on an incident, the modal opens correctly. However, after closing the modal, the incident remains visually "selected" and other incidents disappear from view. They only reappear after reopening and closing the modal again.

**Steps to Reproduce:**
1. Navigate to incident list
2. Click "ver más" on any incident
3. Modal opens correctly
4. Close the modal
5. **Bug:** Incident remains visually selected, other incidents disappear
6. **Workaround:** Reopen and close modal to restore normal view

**Root Cause:**
State management issue where incident selection state is not properly reset when modal closes.

**Affected Components:**
- Incident list modal
- Incident selection state
- Incident visibility logic

**Impact:**
- Users cannot see other incidents after viewing one
- Poor user experience
- Requires workaround to restore functionality

**Notes for Developers:**
- Check modal close handlers
- Verify state cleanup on modal unmount
- Ensure incident selection state is properly reset
- Test with multiple incident types and scenarios

---

## Other Known Issues

*Add other known bugs here as they are discovered*

---

**Last Updated:** $(date)
**Maintained by:** Development Team
