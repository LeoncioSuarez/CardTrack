"""
CardTrack package initialization.

If mysqlclient (MySQLdb) isn't installed, allow using PyMySQL as a drop-in
replacement by calling pymysql.install_as_MySQLdb(). This keeps local dev
environments simpler (no need for compiled mysqlclient) while still allowing
mysqlclient to be used if present.
"""
try:
	import pymysql
	pymysql.install_as_MySQLdb()
except Exception:
	# If PyMySQL isn't installed, Django will raise the original ImportError
	# about missing MySQLdb. We intentionally swallow exceptions here so that
	# the error message from Django remains clear.
	pass
