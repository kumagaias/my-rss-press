# EventBridge module for scheduled Lambda execution

resource "aws_cloudwatch_event_rule" "cleanup_schedule" {
  name                = "${var.project_name}-cleanup-schedule-${var.environment}"
  description         = "Trigger cleanup Lambda daily at 3 AM JST (6 PM UTC previous day)"
  schedule_expression = "cron(0 18 * * ? *)" # 3 AM JST = 6 PM UTC (previous day)
}

resource "aws_cloudwatch_event_target" "cleanup_lambda" {
  rule      = aws_cloudwatch_event_rule.cleanup_schedule.name
  target_id = "CleanupLambda"
  arn       = var.lambda_function_arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cleanup_schedule.arn
}
