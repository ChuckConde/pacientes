/** Calculates a person's age in whole years from an ISO (yyyy-MM-dd) birth date. */
export function calculateAge(birthDateIso: string, today: Date = new Date()): number {
  const birthDate = new Date(`${birthDateIso}T00:00:00`);
  let age = today.getFullYear() - birthDate.getFullYear();
  const alreadyHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!alreadyHadBirthdayThisYear) {
    age -= 1;
  }
  return age;
}
