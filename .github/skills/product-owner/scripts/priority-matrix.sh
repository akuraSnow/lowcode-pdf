#!/usr/bin/env bash
# 简单的 RICE 评分脚本示例（CSV 输入/输出）
# 使用：`cat backlog.csv | ./priority-matrix.sh > backlog-scored.csv`

awk -F"," 'BEGIN{OFS=",";print "id,title,reach,impact,confidence,effort,RICE"}
NR>1{reach=$3;impact=$4;confidence=$5;effort=$6;rice=(reach*impact*confidence)/effort;print $1,$2,reach,impact,confidence,effort,rice}' -
