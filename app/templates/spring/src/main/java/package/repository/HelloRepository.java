package <%= packageName %>.repository;

import <%= packageName %>.domain.Hello;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Generated by wakeup generator at <%= currentDT %>
 * 'http://wakeup.org.in'
 * Hello repository
 */
public interface HelloRepository extends JpaRepository<Hello,Long> { }
