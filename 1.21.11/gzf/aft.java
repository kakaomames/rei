import io.netty.buffer.ByteBuf;
import java.util.List;

public record aft(List<dsa> b) implements aay<adb> {
   public static final aao<ByteBuf, aft> a;

   public aft(List<dsa> param1) {
      this.b = $$0;
   }

   public aba<aft> a() {
      return ahz.aq;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public List<dsa> b() {
      return this.b;
   }

   static {
      a = aao.a(dsa.a.a(aam.a()), aft::b, aft::new);
   }
}
