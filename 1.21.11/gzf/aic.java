import com.mojang.logging.LogUtils;
import org.slf4j.Logger;

public interface aic extends xr {
   Logger a = LogUtils.getLogger();

   default void a(aay $$0, Exception $$1) throws v {
      a.error("Failed to handle packet {}, suppressing error", $$0, $$1);
   }
}
