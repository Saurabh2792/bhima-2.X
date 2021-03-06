const db = require('../../../lib/db');

function getConfigurationData(payrollConfigurationId, params) {
  const transaction = db.transaction();

  const sql = `
    SELECT config_rubric_item.id, config_rubric_item.config_rubric_id, config_rubric_item.rubric_payroll_id, 
    payroll_configuration.label AS PayrollConfig,
    rubric_payroll.* 
    FROM config_rubric_item
    JOIN rubric_payroll ON rubric_payroll.id = config_rubric_item.rubric_payroll_id
    JOIN payroll_configuration ON payroll_configuration.config_rubric_id = config_rubric_item.config_rubric_id
    WHERE payroll_configuration.id = ? AND rubric_payroll.is_percent = 0 AND rubric_payroll.is_tax = 0
    AND rubric_payroll.is_seniority_bonus = 0 AND rubric_payroll.is_family_allowances = 0
    ORDER BY rubric_payroll.label ASC;
  `;

  const getPeriodOffdays = `
    SELECT offday.id, offday.date, offday.percent_pay, offday.label
    FROM offday
    WHERE offday.date >= DATE(?) AND offday.date <= DATE(?);
  `;

  const getEmployeeHoliday = `
    SELECT holiday.id, holiday.label, holiday.dateFrom, holiday.dateTo, holiday.percentage,
     BUID(holiday.employee_uuid) AS employee_uuid
    FROM holiday 
    WHERE ((DATE(holiday.dateFrom) >= DATE(?) AND DATE(holiday.dateTo) <= DATE(?)) OR
    (DATE(holiday.dateFrom) >= DATE(?) AND DATE(holiday.dateFrom) <= DATE(?)) OR
    (DATE(holiday.dateTo) >= DATE(?) AND DATE(holiday.dateTo) <= DATE(?))) AND holiday.employee_uuid = ?
  `;

  const getWeekEndConfig = `
    SELECT config_week_days.indice
    FROM payroll_configuration
    JOIN config_week_days ON config_week_days.weekend_config_id = payroll_configuration.config_weekend_id
    WHERE payroll_configuration.id = ?
  `;

  const getIprConfig = `
    SELECT taxe_ipr.id, taxe_ipr.currency_id, taxe_ipr_configuration.*
    FROM taxe_ipr
    JOIN taxe_ipr_configuration ON taxe_ipr_configuration.taxe_ipr_id = taxe_ipr.id
    JOIN payroll_configuration ON payroll_configuration.config_ipr_id = taxe_ipr.id
    WHERE payroll_configuration.id =  ?
  `;

  transaction
    .addQuery(sql, [payrollConfigurationId])
    .addQuery(getPeriodOffdays, [params.dateFrom, params.dateTo])
    .addQuery(getEmployeeHoliday, [
      params.dateFrom,
      params.dateTo,
      params.dateFrom,
      params.dateTo,
      params.dateFrom,
      params.dateTo,
      db.bid(params.employeeUuid)])
    .addQuery(getWeekEndConfig, [payrollConfigurationId])
    .addQuery(getIprConfig, [payrollConfigurationId]);

  return transaction.execute();
}

exports.getConfigurationData = getConfigurationData;