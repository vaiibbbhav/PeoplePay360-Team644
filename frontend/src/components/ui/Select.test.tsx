import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';

const renderSelect = (onValueChange = vi.fn()) =>
  render(
    <Select onValueChange={onValueChange}>
      <SelectTrigger>
        Department <SelectValue placeholder="Choose a department" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="engineering">Engineering</SelectItem>
        <SelectItem value="people">People</SelectItem>
      </SelectContent>
    </Select>,
  );

test('opens the custom select and moves focus to an option from the keyboard', async () => {
  const user = userEvent.setup();
  renderSelect();

  const trigger = screen.getByRole('button', { name: /department/i });
  trigger.focus();
  await user.keyboard('{ArrowDown}');

  expect(screen.getByRole('listbox')).toBeVisible();
  expect(screen.getByRole('option', { name: 'Engineering' })).toHaveFocus();
});

test('selects an option and closes the listbox', async () => {
  const user = userEvent.setup();
  const onValueChange = vi.fn();
  renderSelect(onValueChange);

  await user.click(screen.getByRole('button', { name: /department/i }));
  await user.click(screen.getByRole('option', { name: 'People' }));

  expect(onValueChange).toHaveBeenCalledWith('people');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
