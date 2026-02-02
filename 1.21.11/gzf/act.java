import io.netty.buffer.ByteBuf;
import java.util.List;

public record act(List<bag> b) implements aay<acq> {
   public static final aao<ByteBuf, act> a;

   public act(List<bag> param1) {
      this.b = $$0;
   }

   public aba<act> a() {
      return aco.i;
   }

   public void a(acq $$0) {
      $$0.a(this);
   }

   public List<bag> b() {
      return this.b;
   }

   static {
      a = aao.a(bag.a.a(aam.c(64)), act::b, act::new);
   }
}
